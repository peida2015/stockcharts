class StockDataController < ApplicationController

  def verify_serve
    data = JSON.parse(params.keys[0])
    id_token = data["id_token"]
    client_id = ENV["google_app_id"]

    verifier = GoogleIDToken::Validator.new
    # 2nd parameter is the audience should be the same as client_id.
    jwt = verifier.check(id_token, client_id, client_id)
    if jwt
      url = URI("http://marketdata.websol.barchart.com/getHistory.json")
      url.query = URI.encode_www_form({
        key: ENV["barchart_api_key"],
        symbol: "GOOG",
        type: "daily",
        startDate: "20160523000000"
        })
      res = Net::HTTP::get(url)
    else
      res = "Authentication failed"
    end

    render :json => res
  end

end
