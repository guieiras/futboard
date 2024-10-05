class Marker
  def initialize(team)
    @team = team
  end

  attr_reader :team

  def build
    source = team.background ?
      team.background.resize_to_fill(400, 400) :
      Magick::Image.new(400, 400) { |image| image.background_color = team.color }

    canvas = Magick::Image.new(400, 400) { |image| image.background_color = 'white' }
    gc = Magick::Draw.new
    gc.fill('transparent')
    gc.stroke('black')
    gc.circle(200, 200, 200, 10)
    gc.draw(canvas)

    logo = team.logo.trim.resize_to_fit(250)
    stroke = logo.resize_to_fit(256).opaque_channel('transparent', 'white', true)

    source
      .composite!(canvas, Magick::CenterGravity, Magick::SoftLightCompositeOp)
      .composite!(stroke, Magick::CenterGravity, 0, 1, Magick::OverCompositeOp)
      .composite!(logo, Magick::CenterGravity, 0, 0, Magick::OverCompositeOp)
  end
end
