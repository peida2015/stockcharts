class SessionController < ApplicationController
  def new
    render :new
  end

  def create
    info = session_params
    session = session[:session_cookie]
  end

  def delete

  end

  private

  def session_params
    params.require(:user).permit(:email, :name, :id_token)
  end
end
