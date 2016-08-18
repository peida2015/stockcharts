Rails.application.routes.draw do
  post 'stock_data' => 'stock_data#verify_serve'
  root 'main#index'
end
