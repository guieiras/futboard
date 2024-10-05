require 'sinatra'
require 'json'
require 'noaccent'
require 'prawn'
require 'rmagick'
require 'zip'

require_relative 'lib/marker'
require_relative 'lib/tile_builder'

Player = Struct.new(:name, :position, :face, :dribble, :move, :shoot, :pass, :steal, :foul)
Team = Struct.new(:name, :background, :color, :logo)

set :public_folder, __dir__ + '/build'

get '/' do
  send_file File.join(settings.public_folder, 'index.html')
end

post '/generate' do
  background = Magick::Image.from_blob(params['background']['tempfile'].read).first
  logo = Magick::Image.from_blob(params['logo']['tempfile'].read).first
  team = Team.new(params[:name], background, params[:color], logo)
  faces = Zip::File.open(params['images']['tempfile']).each_with_object({}) do |entry, object|
    object[entry.name] = Magick::Image.from_blob(entry.get_input_stream.read).first
  end
  players = JSON.parse(params[:players]).map do |player|
    Player.new(
      player['name'], player['position'], faces[player['face']],
      player['dribble'], player['move'], player['shoot'], player['pass'],
      player['steal'], 12)
  end
  cm = lambda { |n| n * 72 / 2.54 }

  marker = Marker.new(team)
  tiles = players.map { |player| TileBuilder.new(player, team) }

  pdf = Prawn::Document.new(page_size: 'A5', margin: 20, page_layout: :landscape)
  tiles.each.with_index do |tile, index|
    pdf.image(
      StringIO.new(tile.build.to_blob),
      at: [(10 + cm.call(3.7) * (index / 3)), (150 + cm.call(3.7) * (index % 3))],
      width: cm.call(3.7), height: cm.call(3.7)
    )
    tile.unload!
  end
  pdf.image(
    StringIO.new(marker.build.to_blob),
    at: [(35 + cm.call(3.7) * (tiles.count / 3) ), (125 + cm.call(3.7) * (tiles.count % 3))],
    width: cm.call(2.1), height: cm.call(2.1)
  )
  team.background.destroy!
  team.logo.destroy!

  attachment "#{team.name.downcase}.pdf"

  pdf.render
end
