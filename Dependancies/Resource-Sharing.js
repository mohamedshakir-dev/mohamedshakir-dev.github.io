class AlpacaCORS {
  constructor(config) {
    this.keyId = config.keyId;
    this.secretKey = config.secretKey;
    this.baseUrl = config.baseUrl || "https://paper-api.alpaca.markets";
  }


/*
 * Most of these functions were gotten from Alpaca API's "How-To Code" examples which
 * documents many functions regarding data requests. A full documentation can be found
 * at the link: https://alpaca.markets/docs/api-documentation/how-to/
 * These functions were not written by me, Mohamed Shakir, however they were all modified to work on a dynamic website
 * For example, instead of passing static variables to functions like shown in the documentation, the functions headers
 * were modified to accept user data as opposed to using set parameters. Comments on some custom written functions can be
 * found below.
 */
  // Helper functions
  httpRequest(method,args,body=undefined) {
    return fetch(`https://cors-anywhere.herokuapp.com/${this.baseUrl}/v2/${args}`, {
      method: method,
      mode: 'cors',
      headers: {
        "APCA-API-KEY-ID": this.keyId,
        "APCA-API-SECRET-KEY": this.secretKey
      },
      body: body,
    });

  }

  dataHttpRequest(method,args,body=undefined) {
    return fetch(`https://cors-anywhere.herokuapp.com/https://data.alpaca.markets/v1/${args}`, {
      method: method,
      mode: 'cors',
      headers: {
        "APCA-API-KEY-ID": this.keyId,
        "APCA-API-SECRET-KEY": this.secretKey,
      },
      body: body
    });
  }
  /*
   * Argument Formatter function used to format user data headers. I think the idea for this was originally found on stackoverflow
   * The point of this function is to take the users data as input, as well as an end point and query, and maps it to a new
   * string in the format appropriate for the various data requests carried out through Alpaca's API.
   */
  argsFormatter(type,path,query) {
    var str = type;
    if(path) {
      path.forEach((element) => {
        str += ("/" + element);
      })
    }
    if(query) {
      if(type){
        str += "?"
      }
      str += Object.keys(query).map(element => encodeURIComponent(element) + "=" + encodeURIComponent(query[element])).join("&");
    }
    return str;
  }

  // Account methods
  getAccount() {
    return this.httpRequest("GET",this.argsFormatter("account",undefined,undefined)).then((resp) => {
      return resp.json();
    }).then((resp) => {
      return resp;
    }).catch((err) => {
      return err;
    });
  }

  // Order methods
  createOrder(body) {
    return this.httpRequest("POST",this.argsFormatter("orders",undefined,undefined),JSON.stringify(body)).then((resp) => {
      return resp.json();
    }).then((resp) => {
      return resp;
    }).catch((err) => {
      return err;
    })
  }

  getOrders(query=undefined) {
    return this.httpRequest("GET",this.argsFormatter("orders",undefined,query)).then((resp) => {
      return resp.json();
    }).then((resp) => {
      return resp;
    }).catch((err) => {
      return err;
    })
  }

  getOrder(path) {
    return this.httpRequest("GET",this.argsFormatter("orders",[path],undefined)).then((resp) => {
      return resp.json();
    }).then((resp) => {
      return resp;
    }).catch((err) => {
      return err;
    })
  }

  getOrderByClientId(query) {
    return this.httpRequest("GET",this.argsFormatter("orders:by_client_order_id",undefined,query)).then((resp) => {
      return resp.json();
    }).then((resp) => {
      return resp;
    }).catch((err) => {
      return err;
    })
  }

  cancelOrder(path) {
    return this.httpRequest("DELETE",this.argsFormatter("orders",[path],undefined)).then((resp) => {
      return resp.json();
    }).then((resp) => {
      return resp;
    }).catch((err) => {
      return err;
    })
  }

  // Position methods
  getPosition(path) {
    return this.httpRequest("GET",this.argsFormatter("positions",[path],undefined)).then((resp) => {
      return resp.json();
    }).then((resp) => {
      return resp;
    }).catch((err) => {
      return err;
    })
  }

  getPositions() {
    return this.httpRequest("GET",this.argsFormatter("positions",undefined,undefined)).then((resp) => {
      return resp.json();
    }).then((resp) => {
      return resp;
    }).catch((err) => {
      return err;
    })
  }

  // Asset methods
  getAssets(query=undefined) {
    return this.httpRequest("GET",this.argsFormatter("assets",undefined,query)).then((resp) => {
      return resp.json();
    }).then((resp) => {
      return resp;
    }).catch((err) => {
      return err;
    })
  }

  getAsset(path) {
    return this.httpRequest("GET",this.argsFormatter("assets",[path],undefined)).then((resp) => {
      return resp.json();
    }).then((resp) => {
      return resp;
    }).catch((err) => {
      return err;
    })
  }

  // Calendar methods
  getCalendar(query=undefined) {
    return this.httpRequest("GET",this.argsFormatter("calendar",undefined,query)).then((resp) => {
      return resp.json();
    }).then((resp) => {
      return resp;
    }).catch((err) => {
      return err;
    })
  }

  // Clock methods
  getClock() {
    return this.httpRequest("GET",this.argsFormatter("clock",undefined,undefined)).then((resp) => {
      return resp.json();
    }).then((resp) => {
      return resp;
    }).catch((err) => {
      localStorage.setItem("ERROR", 401);
      return err;
    })
  }

  // Bars methods
  getBars(path,query1,query2=undefined) {
    let query = typeof query1 === "string" ? query1 : query1.join(',');
    return this.dataHttpRequest("GET",this.argsFormatter("bars",[path],Object.assign({symbols: query},query2))).then((resp) => {
      return resp.json();
    }).then((resp) => {
      return resp;
    }).catch((err) => {
      return err;
    })
  }
}
