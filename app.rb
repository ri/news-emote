Bundler.require

# temporary solution against Encoding::InvalidByteSequenceError for passenger
Encoding.default_external = "UTF-8"

class App < Sinatra::Base
  TRUSTED_JS = %w[script]

  configure do
    set :assets_precompile, %w(application.js application.css)
    set :assets_css_compressor, :sass
    register Sinatra::AssetPipeline

    # Actual Rails Assets integration, everything else is Sprockets
    if defined?(RailsAssets)
      RailsAssets.load_paths.each do |path|
        settings.sprockets.append_path(path)
      end
    end
  end

  get "/" do
    @js = "news"
    erb :index
  end

  # get '/:name' do
  #   if TRUSTED_JS.include?(params[:name])
  #     @js = params[:name]
  #   end
  #   erb :"/#{params[:name]}"
  # end
end
