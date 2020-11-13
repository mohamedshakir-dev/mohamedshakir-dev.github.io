class Alpaca {
  constructor(API_KEY,API_SECRET){
    this.alpaca = new AlpacaCORS({
      keyId: API_KEY,
      secretKey: API_SECRET,
      baseUrl: 'https://paper-api.alpaca.markets'
    });


    this.allStocks = ['DOMO', 'TLRY', 'SQ', 'MRO', 'AAPL', 'GM', 'SNAP', 'SHOP',
                      'SPLK', 'BA', 'AMZN', 'SUI', 'SUN', 'TSLA', 'CGC', 'SPWR',
                      'NIO', 'CAT', 'MSFT', 'PANW', 'OKTA', 'TWTR', 'TM', 'RTN',
                      'ATVI', 'GS', 'BAC', 'MS', 'TWLO', 'QCOM']; /* Array Used To Store ALL stocks
                                                                    the algorithm will be trading with.
                                                                    Can be modified easily by changing or
                                                                    adding ticker symbols.
                                                                  */

    /*
    Temp Array used to store temporary data. For Loop initializes temp array
    for all the stocks in the preset array.
    */
    var temp = [];
    this.allStocks.forEach((stockName) => {
      temp.push({name: stockName, pc: 0});
    });
    this.allStocks = temp.slice();

    /*
    Variables and Arrays for storing Data. All of them are initialized empty
    and will be filled based on the users data.
    */
    this.long = [];
    this.short = [];
    this.qShort = null;
    this.qLong = null;
    this.adjustedQLong = null;
    this.adjustedQShort = null;
    this.blacklist = new Set();
    this.longAmount = 0;
    this.shortAmount = 0;
    this.timeToClose = null;
    this.marketChecker = null;
    this.spin = null;
    this.chart = null;
    this.chart_data = [];
    this.positions = [];
  }

  /*
  * Asynchronous function, runs the script. Starts by looping through all the orders
  * and closes all open positions. Awaits for all promises to be resolved before
  * continuing. Each action is commented further below.
  */
  async run(){
    var orders;
    await this.alpaca.getOrders({
      status: "open",
      direction: "desc"
    }).then((resp) => {
      orders = resp;
    }).catch((err) => {writeToEventLog(err);});
    var promOrders = [];
    orders.forEach((order) => {
      promOrders.push(new Promise(async (resolve,reject) => {
        this.alpaca.cancelOrder(order.id).catch((err) => {writeToEventLog(err);});
        resolve();
      }));
    });
    await Promise.all(promOrders);

  // Waits for market to open. Writes to terminal as it awaits for market open
    writeToEventLog("Waiting for market to open...");
    var promMarket = this.awaitMarketOpen();
    await promMarket;
    writeToEventLog("Market opened.");

    /*
     * Rebalances the portfolio every 60 seconds. If any changes need to be made
     * the algorithm will make new trades accordingly
     */
    this.spin = setInterval(async () => {
      /*
      * Calculates time until the next market close (4:00 PM EST) to ensure trades
      * can still be made within an appropriate time frame
      */
      await this.alpaca.getClock().then((resp) =>{
        var closingTime = new Date(resp.next_close.substring(0,resp.next_close.length - 6));
        var currTime = new Date(resp.timestamp.substring(0,resp.timestamp.length - 6));
        this.timeToClose = Math.abs(closingTime - currTime);
      }).catch((err) => {writeToEventLog(err);});

      /*
      * Checks if time until the next market close is within 15 minutes,
      * if the time is within 15 minutes of the next market close,
      * the algorithm writes to the console and proceeds to close positions
      * Checks the characteristics of each position and fills out an orders
      * ticker accordinly, awaits all orders to be resolved before continuing
      */
      if(this.timeToClose < (60000 * 15)) {
        writeToEventLog("Market closing soon. Closing positions.");

        await this.alpaca.getPositions().then(async (resp) => {
          var promClose = [];
          resp.forEach((position) => {
            promClose.push(new Promise(async (resolve,reject) => {
              var orderSide;
              if(position.side == 'long'){
                orderSide = 'sell';
              } else{
                orderSide = 'buy';
              }
              var quantity = Math.abs(position.qty);
              await this.submitOrder(quantity,position.symbol,orderSide);
              resolve();
            }));
          });
          await Promise.all(promClose);
        }).catch((err) => {writeToEventLog(err);});
        /*
        * Rests for the remainder of the tradings day, writes to terminal to inform user
        */
        clearInterval(this.spin);
        writeToEventLog("Sleeping until market close (15 minutes).");
        setTimeout(() => {
           // Runs script again to prepare the algorithm for the next trading day
          this.run();
        }, 60000*15);
      }
      else {
        /*
        * Reblances portfolio and updates the chart every minute to continue
        * if the day is further than 15 minutes from market closer
        */
        await this.rebalance();
        this.updateChart();
      }
    }, 60000);
  }

  /*
  * Function for waiting for market to open. Creates boolean variable for storing
  * whether or not the market is open, then calls getClock method. Cross Origin Resource
  * sends an HTTP request and returns clock. If the response states that the market is open,
  * the promise is resolved and the program continues. Else it checks how long until the markets
  * open and writes to the terminal informing the user of how long until the market opens. Then checks every
  * minute afterwards.
  */
  awaitMarketOpen(){
    var prom = new Promise(async (resolve, reject) => {
      var isOpen = false;
      await this.alpaca.getClock().then(async (resp) => {
        if(resp.is_open) {
          resolve();
        }
        else {
          this.marketChecker = setInterval(async () => {
            this.updateChart();
            await this.alpaca.getClock().then((resp) => {
              isOpen = resp.is_open;
              if(isOpen) {
                clearInterval(this.marketChecker);
                resolve();
              }
              else {
                var openTime = new Date(resp.next_open.substring(0, resp.next_close.length - 6));
                var currTime = new Date(resp.timestamp.substring(0, resp.timestamp.length - 6));
                this.timeToClose = Math.floor((openTime - currTime) / 1000 / 60);
                writeToEventLog(this.timeToClose + " minutes til next market open.");
              }
            }).catch((err) => {writeToEventLog(err);});
          }, 60000);
        }
      });
    });
    return prom;
  }


  /*
  * Rebalances positions after each update
  */
  async rebalance(){
    await this.rerank();

    // Cycles through all existing orders again.
    var orders;
    await this.alpaca.getOrders({
      status: 'open',
      direction: 'desc'
    }).then((resp) => {
      orders = resp;
    }).catch((err) => {writeToEventLog(err);});
    var promOrders = [];
    orders.forEach((order) => {
      promOrders.push(new Promise(async (resolve, reject) => {
        await this.alpaca.cancelOrder(order.id).catch((err) => {writeToEventLog(err);});
        resolve();
      }));
    });
    await Promise.all(promOrders);

    writeToEventLog("We are taking a long position in: " + this.long.toString());
    writeToEventLog("We are taking a short position in: " + this.short.toString());
    /*
    * Remove positions that are no longer on the list of positions
    * that the algorithm is looking to take, and make a list of positions
    * that do not need to change. Then adjusts quantities if needed.
    */
    var positions;
    await this.alpaca.getPositions().then((resp) => {
      positions = resp;
    }).catch((err) => {writeToEventLog(err);});
    var promPositions = [];
    var executed = {long:[], short:[]};
    var side;
    this.blacklist.clear();
    positions.forEach((position) => {
      promPositions.push(new Promise(async (resolve, reject) => {
        if(this.long.indexOf(position.symbol) < 0){
          // Checks if position is on the list of long equities
          if(this.short.indexOf(position.symbol) < 0){
            // checks if position on the list for short equities, if not on either than closes position
            if(position.side == "long") side = "sell";
            else side = "buy";
            var promCO = this.submitOrder(Math.abs(position.qty), position.symbol, side);
            await promCO.then(() => {resolve();});
          }
          else{
            // Position in short list.
            if(position.side == "long") {
              // Position changed from long to short.  Clear long position and short instead
              var promCS = this.submitOrder(position.qty, position.symbol, "sell");
              await promCS.then(() => {resolve();});
            }
            else {
              if(Math.abs(position.qty) == this.qShort){
                // If the position is where it is supposed to be, continue for now.
              }
              else{
                // Position quantity needs to be adjusted
                var diff = Number(Math.abs(position.qty)) - Number(this.qShort);
                if(diff > 0){
                  // If there are too many quantities short, need to buy more to rebalance position
                  side = "buy"
                }
                else{
                  // If the short quantity is too low, sell more to rebalance portfolio
                  side = "sell"
                }
                var promRebalance = this.submitOrder(Math.abs(diff), position.symbol, side);
                await promRebalance;
              }
              executed.short.push(position.symbol);
              this.blacklist.add(position.symbol);
              resolve();
            }
          }
        }
        else{
            // Repeats process for other side.
          if(position.side == "short"){
            // Position changed from short to long.  Clear short position and long instead.
            var promCS = this.submitOrder(Math.abs(position.qty), position.symbol, "buy");
            await promCS.then(() => {resolve();});
          }
          else{
            if(position.qty == this.qLong){
            }
            else{
              var diff = Number(position.qty) - Number(this.qLong);
              if(diff > 0){
                side = "sell";
              }
              else{
                side = "buy";
              }
              var promRebalance = this.submitOrder(Math.abs(diff), position.symbol, side);
              await promRebalance;
            }
            executed.long.push(position.symbol);
            this.blacklist.add(position.symbol);
            resolve();
          }
        }
      }));
    });
    await Promise.all(promPositions);

    // Sends order with all the adjusted position quantities, which list they are on, and their side.
    var promLong = this.sendBatchOrder(this.qLong, this.long, 'buy');
    var promShort = this.sendBatchOrder(this.qShort, this.short, 'sell');

    var promBatches = [];
    this.adjustedQLong = -1;
    this.adjustedQShort = -1;

    await Promise.all([promLong, promShort]).then(async (resp) => {
      // Handler for rejected promises.
      resp.forEach(async (arrays, i) => {
        promBatches.push(new Promise(async (resolve, reject) => {
          if(i == 0) {
            arrays[1] = arrays[1].concat(executed.long);
            executed.long = arrays[1].slice();
          }
          else {
            arrays[1] = arrays[1].concat(executed.short);
            executed.short = arrays[1].slice();
          }
          // Return rejected orders and determines if new quanties are required for purchase.
          if(arrays[0].length > 0 && arrays[1].length > 0){
            var promPrices = this.getTotalPrice(arrays[1]);

            await Promise.all(promPrices).then((resp) => {
              var completeTotal = resp.reduce((a, b) => a + b, 0);
              if(completeTotal != 0){
                if(i == 0){
                  this.adjustedQLong = Math.floor(this.longAmount / completeTotal);
                }
                else{
                  this.adjustedQShort = Math.floor(this.shortAmount / completeTotal);
                }
              }
            });
          }
          resolve();
        }));
      });
      await Promise.all(promBatches);
    }).then(async () => {
      // Reorders stocks that did were resolved successfully so that the equity quota is reached.
      var promReorder = new Promise(async (resolve, reject) => {
        var promLong = [];
        if(this.adjustedQLong >= 0){
          this.qLong = this.adjustedQLong - this.qLong;
          executed.long.forEach(async (stock) => {
            promLong.push(new Promise(async (resolve, reject) => {
              var promLong = this.submitOrder(this.qLong, stock, 'buy');
              await promLong;
              resolve();
            }));
          });
        }

        var promShort = [];
        if(this.adjustedQShort >= 0){
          this.qShort = this.adjustedQShort - this.qShort;
          executed.short.forEach(async(stock) => {
            promShort.push(new Promise(async (resolve, reject) => {
              var promShort = this.submitOrder(this.qShort, stock, 'sell');
              await promShort;
              resolve();
            }));
          });
        }
        var allProms = promLong.concat(promShort);
        if(allProms.length > 0){
          await Promise.all(allProms);
        }
        resolve();
      });
      await promReorder;
    });
  }

  // Re-ranks all stocks to create new list of short and long positions accordingly
  async rerank(){
    // Calls rank function again to resort the list of stocks
    await this.rank();

    // Grabs the top and bottom quarter of the sorted stock list to get the long and short lists.
    var longShortAmount = Math.floor(this.allStocks.length / 4);
    this.long = [];
    this.short = [];
    for(var i = 0; i < this.allStocks.length; i++){
      if(i < longShortAmount) this.short.push(this.allStocks[i].name);
      else if(i > (this.allStocks.length - 1 - longShortAmount)) this.long.push(this.allStocks[i].name);
      else continue;
    }

    // Determines quantity based on price of each stock in each list
    var equity;
    await this.alpaca.getAccount().then((resp) => {
      equity = resp.equity;
    }).catch((err) => {writeToEventLog(err);});
    this.shortAmount = 0.30 * equity; // Sets the max equity available to be tied up in short positions to 30% of total equity.
    this.longAmount = Number(this.shortAmount) + Number(equity);

    var promLong = await this.getTotalPrice(this.long);
    var promShort = await this.getTotalPrice(this.short);
    var longTotal;
    var shortTotal;
    await Promise.all(promLong).then((resp) => {
      longTotal = resp.reduce((a, b) => a + b, 0);
    });
    await Promise.all(promShort).then((resp) => {
      shortTotal = resp.reduce((a, b) => a + b, 0);
    });

    this.qLong = Math.floor(this.longAmount / longTotal);
    this.qShort = Math.floor(this.shortAmount / shortTotal);
  }

  // Get the total price of the array of input stocks.
  getTotalPrice(stocks){
    var proms = [];
    stocks.forEach(async (stock) => {
      proms.push(new Promise(async (resolve, reject) => {
        await this.alpaca.getBars('minute', stock, {limit: 1}).then((resp) => {
          resolve(resp[stock][0].c);
        }).catch((err) => {writeToEventLog(err);});
      }));
    });
    return proms;
  }

  /*
  * Submit an order for all stocks with a quanity above 0. Writes to terminal all trades that are made or
  * that are unsuccessful
  */
  async submitOrder(quantity, stock, side){
    var prom = new Promise(async (resolve, reject) => {
      if(quantity > 0){
        await this.alpaca.createOrder({
          symbol: stock,
          qty: quantity,
          side: side,
          type: 'market',
          time_in_force: 'day',
        }).then(() => {
          writeToEventLog("Market order of |" + quantity + " " + stock + " " + side + "| completed.");
          resolve(true);
        }).catch((err) => {
          writeToEventLog("Order of |" + quantity + " " + stock + " " + side + "| did not go through.");
          resolve(false);
        });
      }
      else {
        writeToEventLog("Quantity is <= 0, order of |" + quantity + " " + stock + " " + side + "| not sent.");
        resolve(true);
      }
    });
    return prom;
  }

  // Sends a batch order for all the stocks on a given list and returns all rejected or fulfilled promises.
  async sendBatchOrder(quantity, stocks, side){
    var prom = new Promise(async (resolve, reject) => {
      var incomplete = [];
      var executed = [];
      var promOrders = [];
      stocks.forEach(async (stock) => {
        promOrders.push(new Promise(async (resolve, reject) => {
          if(!this.blacklist.has(stock)){ // Checks if the stock is not blacklisted, if it is not black listed create new order ticket
            var promSO = this.submitOrder(quantity, stock, side);
            await promSO.then((resp) => {
              if(resp) executed.push(stock);
              else incomplete.push(stock);
              resolve();
            });
          }
          else resolve();
        }));
      });
      await Promise.all(promOrders).then(() => {
        resolve([incomplete, executed]);
      });
    });
    return prom;
  }

  /*
   * Calculates stock price action by checking the stock price over an interval of time (10 minutes)
   * Then stores the percent change in the .pc modifier. This is an essential piece of the ranking function since
   * the change is price over a short period of time is the primary factor for which stock the algorithm
   * finds desiriable then it decides which side to take also depending on the price action.
   */
  getPercentChanges(allStocks){
    var length = 10;
    var promStocks = [];
    allStocks.forEach((stock) => {
      promStocks.push(new Promise(async (resolve, reject) => {
        await this.alpaca.getBars('minute', stock.name, {limit: length}).then((resp) => {
          stock.pc  = (resp[stock.name][length - 1].c - resp[stock.name][0].o) / resp[stock.name][0].o;
        }).catch((err) => {writeToEventLog(err);});
        resolve();
      }));
    });
    return promStocks;
  }

  /*
   * Function for ranking stocks, the premise of this algorithms trading mechanism.
   */
  async rank(){
    // Starts by obtaining the percent change of all the stocks then waits for all promises to be resolved.
    var promStocks = this.getPercentChanges(this.allStocks);
    await Promise.all(promStocks);
    /*
     * Sorts the array of stocks based on their precent change, the algorithm will later take
     * long positions on the better perfomring stocks and short the worse ones.
     */
    this.allStocks.sort((a, b) => {return a.pc - b.pc;});
  }

  /*
   * Function for killing script, clears algorithm and rebalances the portfolio
   * until all positions are closed.
   */
  kill() {
    clearInterval(this.marketChecker);
    clearInterval(this.spin);
    throw new error("Killed script");
  }

  /*
   * Initializes chart through chart.js framework
   */
  async init() {
    var prom = this.getTodayOpenClose(); // Creates variable to store promise object for the days open and close
    await prom.then((resp) => { // awaits for chart to be succesfully resolved
      this.chart = new Chart(document.getElementById("main_chart"), { // Creates new chart and passes user data for the headers
        type: 'line',
        data: {
          datasets: [{
            label: "Equity",
            data: []
          }]
        },
        options: {
          scales: {
            xAxes: [{
              type: 'time',
              time: {
                unit: 'hour',
                min: resp[0],
                max: resp[1]
              },
            }],
            yAxes: [{

            }],
          },
          title: {
            display: true,
            text: "Equity"
          },
        }
      });
      this.updateChart(); // will continue to update chart
    });
  }

  // Updates chart by pushing new user portfolio data, changes y axis dataset to the new user equity
  updateChart() {
    this.alpaca.getAccount().then((resp) => {
      this.chart.data.datasets[0].data.push({
        t: new Date(),
        y: resp.equity
      });
      this.chart.update();
    });
    this.updateOrders(); // Updates positions and orders in case any changed were made
    this.updatePositions();
  }

  /*
   * Gets the open and close time, this is done simply through JavaScript, the program gets the time and date
   * to create a new Date object, then sets the offset to the appropriate time zone for the New York Stock Exchange
   * and does the appropriate conversion. Then sets the open and close time to the users time account for the difference
   * in the offset as well as the open and close time of the New York Stock Exchange (9:30 AM - 4:00 PM)
   */
  getTodayOpenClose() {
    return new Promise(async (resolve,reject) => {
      await this.alpaca.getClock().then(async (resp) => {
        await this.alpaca.getCalendar({
          start: resp.timestamp,
          end: resp.timestamp
        }).then((resp) => {
          var openTime = resp[0].open;
          var closeTime = resp[0].close;
          var calDate = resp[0].date;

          openTime = openTime.split(":");
          closeTime = closeTime.split(":");
          calDate = calDate.split("-");

          var offset = new Date(new Date().toLocaleString('en-US',{timeZone: 'America/New_York'})).getHours() - new Date().getHours();

          openTime = new Date(calDate[0],calDate[1]-1,calDate[2],openTime[0]-offset,openTime[1]);
          closeTime = new Date(calDate[0],calDate[1]-1,calDate[2],closeTime[0]-offset,closeTime[1]);
          resolve([openTime,closeTime]);
        });
      });
    });
  }

  // Obtains users data and gets new/modified positions to append the positions log with the updated data from each position.
  updatePositions() {
    $("#positions-log").empty();
    this.alpaca.getPositions().then((resp) => {
      resp.forEach((position) => {
        $("#positions-log").prepend(
          `<div class="position-inst">
            <p class="position-fragment">${position.symbol}</p>
            <p class="position-fragment">${position.qty}</p>
            <p class="position-fragment">${position.side}</p>
            <p class="position-fragment">${position.unrealized_pl}</p>
          </div>`
        );
      })
    })
  }
/*
 * Works the same way as positions method, except for the getOrders() function, the header: status is passed
 * to specify that we only want the open orders and not any closed orders so that the list does not get populated
 * with old orders.
 */
  updateOrders() {
    $("#orders-log").empty();
    this.alpaca.getOrders({
      status: "open"
    }).then((resp) => {
      resp.forEach((order) => {
        $("#orders-log").prepend(
          `<div class="order-inst">
            <p class="order-fragment">${order.symbol}</p>
            <p class="order-fragment">${order.qty}</p>
            <p class="order-fragment">${order.side}</p>
            <p class="order-fragment">${order.type}</p>
          </div>`
        );
      })
    })
  }
} // End class Alpaca

/*
 * The primary login function. When the login button is clicked, the text fields data is saved and initialized
 * in a new Alpaca. Then, a fetch request is sent to recieve a response from the server. If the servers
 * response is an error, then the error message "Invalid Keys" is shown to alert the user. Only if the error
 * is not an unauthorized error, then the user has entered valid keys and is navigated to the main page.
 */
function checkKeys (){
  var apikey = document.getElementById("api-key").value;
  var secretkey = document.getElementById("secret-key").value;
  var ls = new Alpaca(apikey, secretkey);
  localStorage.setItem("API_KEY", apikey);
  localStorage.setItem("SECRET_KEY", secretkey);
  fetch('https://cors-anywhere.herokuapp.com/https://data.alpaca.markets/v1', {
    headers: {
        'APCA-API-KEY-ID': apikey,
        'APCA-API-SECRET-KEY': secretkey
    }
  }) .then(function(response){
      if(response.status!==403) {
          window.location.href = "../Main-page/main-page.html";
          throw new Error(response.status)
       }
       else{
         document.getElementById("Alert").style.display = 'block';
       }
     })
    .catch(function(error){
      throw new error(response.status);
    });
}
// Kills the script and alerts the user in the terminal by writting to the event log.
function killScript(){
  $("#event-log").html("Killing script.");
  ls.kill();
}
// Simply writes to event log, recieves any text and simply adds it to the log.
function writeToEventLog(text) {
  $("#event-log").prepend(`<p class="event-fragment">${text}</p>`)
}
