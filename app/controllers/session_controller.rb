class SessionController < ApplicationController
  def new
    render :new
  end

  private

  def session_params
    params.require(:user).permit(:email, :name, :id_token)
  end
end
