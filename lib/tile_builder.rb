class TileBuilder
  def initialize(player, team)
    @player = player
    @team = team
    @static = {
      defender: load_image('images/defender.png'),
      dribble: load_image('images/dribble.png'),
      forward: load_image('images/forward.png'),
      foul: load_image('images/foul.png'),
      goalkeeper: load_image('images/goalkeeper.png'),
      gloves: load_image('images/gloves.png'),
      mask: load_image('images/mask.png'),
      midfield: load_image('images/midfield.png'),
      move: load_image('images/move.png'),
      pass11: load_image('images/pass11.png'),
      pass14: load_image('images/pass14.png'),
      pass17: load_image('images/pass17.png'),
      shoot: load_image('images/shoot.png'),
      steal: load_image('images/steal.png'),
      whistle: load_image('images/whistle.png')
    }
  end

  attr_reader :player, :team

  def build
    composite_face!
    composite_move!
    composite_dribble!
    composite_position!
    composite_foul!
    composite_steal!
    composite_shoot!
    composite_pass!
    composite_name!
    composite_logo!

    result
      .composite!(@static[:mask], 0, 0, Magick::CopyAlphaCompositeOp)
      .rotate(45)
      .crop(267, 266, 828, 828, true)
  end

  def unload!
    @static.each_value(&:destroy!)
    player.face.destroy!
    result.destroy!
  end

  private

  def result
    @result ||= (
      team.background ?
        team.background.resize_to_fill(1362, 1362) :
        Magick::Image.new(1362, 1362) { |image| image.background_color = team.color }
    )
  end

  def composite_face!
    result.composite!(
      player.face.trim.resize_to_fit(800),
      Magick::NorthGravity, 0, 500,
      Magick::OverCompositeOp
    )
  end

  def composite_move!
    result.composite!(@static[:move], 633, 205, Magick::OverCompositeOp) if player.move > 0
    result.composite!(@static[:move], 578, 260, Magick::OverCompositeOp) if player.move > 1
    result.composite!(@static[:move], 688, 260, Magick::OverCompositeOp) if player.move > 2
    result.composite!(@static[:move], 633, 315, Magick::OverCompositeOp) if player.move > 3
  end

  def composite_dribble!
    result.composite!(@static[:dribble], 675, 320, Magick::OverCompositeOp) if player.dribble
  end

  def composite_position!
    position = {
      'GL' => 'GL',
      'DL' => 'DL',
      'DF' => 'DF',
      'MD' => 'MC',
      'MC' => 'MC',
      'MCO' => 'MC',
      'ML' => 'MC',
      'AL' => 'AT',
      'AC' => 'AT',
      'SA' => 'AT'
    }[player.position]
    image = {
      'GL' => @static[:goalkeeper],
      'DF' => @static[:defender],
      'DL' => @static[:defender],
      'MC' => @static[:midfield],
      'AT' => @static[:forward]
    }[position]

    result.composite!(image, 301, 980, Magick::OverCompositeOp)
    render_player_position(position)
  end

  def composite_foul!
    result.composite!(@static[:whistle], 430, 516, Magick::OverCompositeOp)
    result.composite!(@static[:foul], 327, 513, Magick::OverCompositeOp)

    rage = drawer
    rage.kerning(-8)

    if player.foul >= 10
      rage.pointsize(120)
      rage.text(335,598, player.foul.to_s)
    else
      rage.pointsize(130)
      rage.text(360, 598, player.foul.to_s)
    end

    rage.draw(result)
  end

  def composite_steal!
    result.composite!(@static[:steal], 355, 646, Magick::OverCompositeOp)

    steal = drawer
    steal.pointsize(130)
    steal.text(295, 742, player.steal.to_s)
    steal.draw(result)
  end

  def composite_shoot!
    if player.position == 'GL'
      result.composite!(@static[:gloves], 872, 678, Magick::OverCompositeOp)
    else
      result.composite!(@static[:shoot], 812, 678, Magick::OverCompositeOp)
    end

    shoot = drawer
    shoot.pointsize(158)
    shoot.text(977, 760, player.shoot.to_s)
    shoot.draw(result)
  end

  def composite_pass!
    {
      11 => @static[:pass11],
      14 => @static[:pass14],
      17 => @static[:pass17]
    }[player.pass].tap do |image|
      result.composite!(image, 890, 490, Magick::OverCompositeOp)
    end

    pass = drawer

    pass.pointsize(65)
    pass.text(840, 614, 'P')

    pass.kerning(0)
    pass.pointsize(135)
    pass.text(910, 614, player.pass.to_s)

    pass.draw(result)
  end

  def composite_name!
    layer = Magick::Image.new(1362, 1362) do |options|
      options.background_color = 'none'
    end

    name = Magick::Draw.new
    name.font = File.expand_path("fonts/opineheavy.ttf")
    name.fill('white')
    name.stroke('black')
    name.stroke_width(1)
    name.text_align(Magick::CenterAlign)
    name.gravity(Magick::CenterGravity)
    name.pointsize(80 - ((player.name.length / 3).floor * 6.2))
    name.text(680, 466, player.name.upcase)
    name.draw(layer)
    shadow = layer.shadow(1, 1, 1, 1)
    result.composite!(shadow, 0, 0, Magick::OverCompositeOp)
    result.composite!(layer, 0, 0, Magick::OverCompositeOp)
  end

  def composite_logo!
    layer = Magick::Image.new(1362, 1362) do |options|
      options.background_color = 'none'
    end
    layer.composite!(team.logo.resize_to_fit(140, 140), Magick::CenterGravity, 0, 290, Magick::OverCompositeOp)
    shadow = layer.shadow(1, 1, 1, 1)
    result.composite!(shadow, 0, 0, Magick::OverCompositeOp)
    result.composite!(layer, 0, 0, Magick::OverCompositeOp)
  end

  def drawer
    Magick::Draw.new.tap do |draw|
      draw.font = File.expand_path('fonts/arblanca.ttf')
      draw.fill('white')
      draw.stroke('black')
      draw.stroke_width(2)
    end
  end

  def render_player_position(position)
    layer = Magick::Image.new(1362, 1362) do |options|
      options.background_color = 'none'
    end
    drawer = Magick::Draw.new
    drawer.font = File.expand_path("fonts/opineheavy.ttf")
    drawer.fill('white')
    drawer.text_align(Magick::CenterAlign)
    drawer.gravity(Magick::CenterGravity)
    drawer.pointsize(75)
    drawer.text(682, 1107, position)
    drawer.draw(layer)
    shadow = layer.shadow(1, 1, 1, 1)

    result.composite!(shadow, 0, 0, Magick::OverCompositeOp)
    result.composite!(layer, 0, 0, Magick::OverCompositeOp)
  end

  def load_image(path)
    Magick::Image.read(File.expand_path(path)).first
  end
end
