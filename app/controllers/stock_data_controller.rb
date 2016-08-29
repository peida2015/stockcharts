class StockDataController < ApplicationController

  def verify_serve
    data = JSON.parse(params.keys[0])
    id_token = data["id_token"]

    if id_token = "limited"
      data["symbol"] = "GOOG"
      res = request_query(data)
    else
      jwt = verify_id_token(id_token)

      if jwt
        res = request_query(data)
      else
        res = "Authentication failed"
      end
    end

    # Parse response and attach original request params to res  
    res = JSON.parse(res)
    res["request"] = {}
    res["request"]["id_token"] = id_token
    res["request"]["symbol"] = data["symbol"]
    res["request"]["type"] = data["type"]
    res["request"]["startDate"] = data["startDate"]
    res["request"]["endDate"] = data["endDate"]

    render :json => res
  end

  private
  def verify_id_token(id_token)
    client_id = ENV["google_app_id"]

    verifier = GoogleIDToken::Validator.new
    # 2nd parameter is the audience should be the same as client_id.

    jwt = verifier.check(id_token, client_id, client_id)
  end

  def request_query(data)
    url = URI("http://marketdata.websol.barchart.com/getHistory.json")
    url.query = URI.encode_www_form({
      key: ENV["barchart_api_key"],
      symbol: data["symbol"],
      type: data["type"],
      startDate: data["startDate"],
      endDate:data["endDate"]
      })
      res = Net::HTTP::get(url)
  end
end
