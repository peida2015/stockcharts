class StockDataController < ApplicationController

  def verify_serve
    data = JSON.parse(params.keys[0])
    id_token = data["id_token"]

    jwt = verify_id_token(id_token)

    if jwt
      url = URI("http://marketdata.websol.barchart.com/getHistory.json")
      url.query = URI.encode_www_form({
        key: ENV["barchart_api_key"],
        symbol: data["symbol"],
        type: data["type"],
        startDate: data["startDate"],
        endDate:data["endDate"]
        })
      res = Net::HTTP::get(url)
    else
      res = "Authentication failed"
    end

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
end
