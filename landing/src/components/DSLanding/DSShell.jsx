import { memo } from 'react'

function DSShell({ isPowerOn, topScreen, bottomScreen, onDpad, onButton }) {
  const handleDpad = (direction) => {
    if (onDpad) onDpad(direction)
  }

  const handleButton = (button) => {
    if (onButton) onButton(button)
  }

  return (
    <div className="ds-shell">
      {/* Top Half */}
      <div className="ds-top-half">
        {/* Speaker grilles */}
        <div className="ds-speakers">
          <div className="ds-speaker-grille left">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="speaker-hole" />
            ))}
          </div>
          <div className="ds-speaker-grille right">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="speaker-hole" />
            ))}
          </div>
        </div>

        {/* Top Screen */}
        <div className="ds-screen-bezel top">
          <div className={`ds-screen top ${isPowerOn ? 'on' : ''}`}>
            {topScreen}
          </div>
        </div>

        {/* Camera (decorative) */}
        <div className="ds-camera" />
      </div>

      {/* Hinge */}
      <div className="ds-hinge">
        <div className="ds-hinge-segment left" />
        <div className="ds-hinge-segment center" />
        <div className="ds-hinge-segment right" />
      </div>

      {/* Bottom Half */}
      <div className="ds-bottom-half">
        {/* Main control area: D-Pad | Screen | Buttons */}
        <div className="ds-bottom-main">
          {/* D-Pad on left */}
          <div className="ds-dpad">
            <div className="dpad-up" onClick={() => handleDpad('up')} />
            <div className="dpad-right" onClick={() => handleDpad('right')} />
            <div className="dpad-down" onClick={() => handleDpad('down')} />
            <div className="dpad-left" onClick={() => handleDpad('left')} />
            <div className="dpad-center" />
          </div>

          {/* Bottom Screen in center */}
          <div className="ds-screen-bezel bottom">
            <div className={`ds-screen bottom ${isPowerOn ? 'on' : ''}`}>
              {bottomScreen}
            </div>
          </div>

          {/* ABXY Buttons on right */}
          <div className="ds-buttons">
            <div className="ds-btn btn-x" onClick={() => handleButton('X')}>X</div>
            <div className="ds-btn btn-y" onClick={() => handleButton('Y')}>Y</div>
            <div className="ds-btn btn-a" onClick={() => handleButton('A')}>A</div>
            <div className="ds-btn btn-b" onClick={() => handleButton('B')}>B</div>
          </div>
        </div>

        {/* Start/Select below */}
        <div className="ds-start-select">
          <div className="ds-small-btn select" onClick={() => handleButton('SELECT')}>SELECT</div>
          <div className="ds-small-btn start" onClick={() => handleButton('START')}>START</div>
        </div>

        {/* Power LED */}
        <div className={`ds-power-led ${isPowerOn ? 'on' : ''}`} />

        {/* Mic hole (decorative) */}
        <div className="ds-mic-hole" />
      </div>
    </div>
  )
}

export default memo(DSShell)
