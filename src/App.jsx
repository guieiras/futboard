import React, { useCallback } from 'react'
import {
  Button, Container, Header, Icon, Input, Image, Label, Menu, Popup, Segment, Select,
  Table, TableBody, TableHeader, TableHeaderCell, TableRow
} from 'semantic-ui-react'
import { useDropzone } from 'react-dropzone'
import JSZip from 'jszip'
import Slider from 'rc-slider'
import { SketchPicker } from 'react-color'
import YAML from 'js-yaml'
import { processTemplate, randomizeStats } from './lib/TemplateProcessor'

export default function App() {
  const [name, setName] = React.useState('')
  const [color, setColor] = React.useState('#000000')
  const [backgroundFile, setBackgroundFile] = React.useState(null)
  const [backgroundImage, setBackgroundImage] = React.useState(null)
  const backgroundRef = React.useRef(null)
  const [logoFile, setLogoFile] = React.useState(null)
  const [logoImage, setLogoImage] = React.useState(null)
  const logoRef = React.useRef(null)
  const [players, setPlayers] = React.useState([])
  const [zipFile, setZipFile] = React.useState(null)
  const [isDownloading, setIsDownloading] = React.useState(false)

  const label = (color) => ({ color, empty: true, circular: true })
  const playerPositions = [
    { key: '', value: '', text: 'Manual' },
    { key: 'GL', value: 'GL', text: 'Goleiro', label: label('orange') },
    { key: 'DL', value: 'DL', text: 'Lateral', label: label('yellow') },
    { key: 'DF', value: 'DF', text: 'Zagueiro', label: label('yellow') },
    { key: 'MD', value: 'MD', text: 'Volante', label: label('green') },
    { key: 'MC', value: 'MC', text: 'Meio-campo', label: label('green') },
    { key: 'MCO', value: 'MCO', text: 'Meia Ofensivo', label: label('green') },
    { key: 'ML', value: 'ML', text: 'Ala', label: label('green') },
    { key: 'AL', value: 'AL', text: 'Ponta', label: label('blue') },
    { key: 'SA', value: 'SA', text: 'Segundo Atacante', label: label('blue') },
    { key: 'AC', value: 'AC', text: 'Centroavante', label: label('blue') }
  ]

  const onDrop = useCallback(acceptedFiles => { setZipFile(acceptedFiles[0]) }, [])
  const handleBackgroundChange = (e) => {
    setBackgroundImage(URL.createObjectURL(e.target.files[0]))
    setBackgroundFile(e.target.files[0])
  }
  const handleLogoChange = (e) => {
    setLogoImage(URL.createObjectURL(e.target.files[0]))
    setLogoFile(e.target.files[0])
  }

  React.useEffect(() => {
    if (!zipFile) return

    JSZip.loadAsync(zipFile).then((zip) => {
      setPlayers(
        Object.keys(zip.files).map((face) => (
          { name: face.split('.')[0], face, position: '', star: false, move: 1, dribble: false, shoot: 0, pass: 11, steal: 0 }
        ))
      )
    })
  }, [zipFile])

  const { getRootProps, getInputProps } = useDropzone({ onDrop, accept: 'application/zip' })

  const changePlayerField = (field, i) => (e) => {
    setPlayers(players.map((player, j) => i === j ? { ...player, [field]: e.target.value } : player))
  }
  const changePlayerSlider = (field, i) => (value) => {
    setPlayers(players.map((player, j) => i === j ? { ...player, [field]: value } : player))
  }
  const changePlayerPosition = (i) => (e, { value }) => {
    setPlayers(players.map((player, j) => i === j ? { ...player, position: value } : player))
  }
  const togglePlayerField = (field, i) => () => {
    setPlayers(players.map((player, j) => i === j ? { ...player, [field]: !player[field] } : player))
  }
  const loadTemplate = (e) => {
    const reader = new FileReader()
    reader.onload = () => {
      const data = YAML.load(reader.result)
      setName(data.name)
      setColor(data.color)
      setPlayers(processTemplate(players, data.players))
    }

    if (e.target.files[0]) { reader.readAsText(e.target.files[0]) }
  }
  const updatePlayer = (i) => () => {
    const template = ({ position, star }) => position + (star ? '+' : '')
    setPlayers(players.map((player, j) => i === j ? { ...player, ...randomizeStats(template(player), {}) } : player))
  }

  const downloadTemplate = () => {
    const template = {
      name, color,
      players: players.map(({ name, face, position, star, move, dribble, shoot, steal, pass }) => (
        { name, face, position, star, move, dribble, shoot, steal, pass }
      ))
    }
    const blob = new Blob([YAML.dump(template)], { type: 'application/yaml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'template.yaml'
    a.click()
  }
  const downloadPDF = () => {
    setIsDownloading(true)
    const formData = new FormData()
    formData.append('name', name)
    formData.append('color', color)
    formData.append('players', JSON.stringify(
      players.map(({ name, face, position, star, move, dribble, shoot, pass, steal }) => (
        { name, face, position, star, move, dribble, shoot, pass, steal }
      )
    )))
    formData.append('images', zipFile, 'images.zip')
    formData.append('background', backgroundFile, 'background.png')
    formData.append('logo', logoFile, 'logo.png')

    fetch('/generate', { method: 'POST', body: formData })
      .then(res => res.blob())
      .then(data => {
        const a = document.createElement("a");
        a.href = window.URL.createObjectURL(data);
        a.download = `${name.toLowerCase()}.pdf`;
        setIsDownloading(false)
        a.click();
      })
  }

  return (
    <div className="App">
      <Menu inverted>
        <Menu.Item header>Futboard</Menu.Item>
      </Menu>

      <Container>
        {
          zipFile ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell colspan={4}>
                      {zipFile.name}
                    </TableHeaderCell>
                    <TableHeaderCell>
                      <div className='ui right aligned'>
                        <Button size="mini" icon='trash' onClick={() => setZipFile(null)} color='red' />
                        <Button size="mini" icon='download' onClick={downloadTemplate} content="Template" />
                        <Button size="mini" icon='download' onClick={downloadPDF} disabled={!(zipFile && backgroundFile && logoFile)} color='green' content="PDF" loading={isDownloading} />
                      </div>
                    </TableHeaderCell>
                  </TableRow>
                  <TableRow>
                    <TableHeaderCell>Nome</TableHeaderCell>
                    <TableHeaderCell>Template</TableHeaderCell>
                    <TableHeaderCell textAlign='center'>Background</TableHeaderCell>
                    <TableHeaderCell textAlign='center'>Logo</TableHeaderCell>
                    <TableHeaderCell textAlign='center'>Cor</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <Table.Cell>
                      <Input value={name} onChange={(e) => setName(e.target.value)} />
                    </Table.Cell>
                    <Table.Cell>
                      <input
                        type="file"
                        accept='application/yaml'
                        onChange={loadTemplate}
                      />
                    </Table.Cell>
                    <Table.Cell>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <input
                          style={{ display: 'none' }}
                          ref={backgroundRef}
                          type="file"
                          onChange={handleBackgroundChange}
                        />
                        <div onClick={() => backgroundRef.current.click()} style={{ width: 50, height: 50, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                          {
                            backgroundImage ? (
                              <Image src={backgroundImage} />
                            ) : (
                              <Icon name='image' size='big' />
                            )
                          }
                        </div>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <input
                          style={{ display: 'none' }}
                          ref={logoRef}
                          type="file"
                          onChange={handleLogoChange}
                        />
                        <div onClick={() => logoRef.current.click()} style={{ width: 50, height: 50, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                          {
                            logoImage ? (
                              <Image style={{ maxWidth: '100%', maxHeight: '100%' }} src={logoImage} />
                            ) : (
                              <Icon name='image' size='big' />
                            )
                          }
                        </div>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <Popup
                          content={<SketchPicker color={color} onChange={({ hex }) => setColor(hex)} />}
                          on='click'
                          popper={{ id: 'popper-container', style: { zIndex: 2000 } }}
                          trigger={<Button style={{ backgroundColor: color, border: '1px solid #ddd' }} />}
                        />
                      </div>
                    </Table.Cell>
                  </TableRow>
                </TableBody>
              </Table>
              <Table>
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell width={1}>Nome</Table.HeaderCell>
                    <Table.HeaderCell width={1}>Posição</Table.HeaderCell>
                    <Table.HeaderCell width={1}>Face</Table.HeaderCell>
                    <Table.HeaderCell width={1}>Movimento</Table.HeaderCell>
                    <Table.HeaderCell width={1}>Chute</Table.HeaderCell>
                    <Table.HeaderCell width={1}>Passe</Table.HeaderCell>
                    <Table.HeaderCell width={1}>Desarme</Table.HeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {players.map((player, i) => (
                    <Table.Row key={player.face}>
                      <Table.Cell>
                        <Input value={player.name} onChange={changePlayerField('name', i)} />
                      </Table.Cell>
                      <Table.Cell style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Select value={player.position} onChange={changePlayerPosition(i)} options={playerPositions} />
                        <Button color={player.star ? 'yellow' : null} icon='star' size='mini' onClick={togglePlayerField('star', i)} />
                        <Button icon='refresh' size='mini' onClick={updatePlayer(i)} />
                      </Table.Cell>
                      <Table.Cell>
                        <Label size='small'>{player.face}</Label>
                      </Table.Cell>
                      <Table.Cell>
                        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                          <Slider value={player.move} min={1} max={4} onChange={changePlayerSlider('move', i)} />
                          <Label size='mini'>{player.move}</Label>
                          <Button
                            primary={Boolean(player.dribble)}
                            icon='expand arrows alternate'
                            size='mini'
                            onClick={togglePlayerField('dribble', i)}
                          />
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                          <Slider value={player.shoot} min={0} max={10} onChange={changePlayerSlider('shoot', i)} />
                          <Label size='mini'>{player.shoot}</Label>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                          <Slider value={player.pass} min={11} max={17} step={3} onChange={changePlayerSlider('pass', i)} />
                          <Label size='mini'>{player.pass}</Label>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                          <Slider value={player.steal} min={0} max={8} onChange={changePlayerSlider('steal', i)} />
                          <Label size='mini'>{player.steal}</Label>
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>
            </>
          ) : (
            <Segment placeholder>
              <Header icon {...getRootProps()}>
                <input {...getInputProps()} />
                <Icon name='zip' />
                <p>Arraste e solte um arquivo ZIP aqui ou clique para selecionar</p>
              </Header>
            </Segment>
          )
        }
      </Container>
    </div>
  );
}
