import { memo } from 'react'

function DSShell({ isPowerOn, topScreen, bottomScreen }) {
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
        {/* Bottom Screen */}
        <div className="ds-screen-bezel bottom">
          <div className={`ds-screen bottom ${isPowerOn ? 'on' : ''}`}>
            {bottomScreen}
          </div>
        </div>

        {/* Controls */}
        <div className="ds-controls">
          {/* D-Pad */}
          <div className="ds-dpad">
            <div className="dpad-up" />
            <div className="dpad-right" />
            <div className="dpad-down" />
            <div className="dpad-left" />
            <div className="dpad-center" />
          </div>

          {/* ABXY Buttons */}
          <div className="ds-buttons">
            <div className="ds-btn btn-x">X</div>
            <div className="ds-btn btn-y">Y</div>
            <div className="ds-btn btn-a">A</div>
            <div className="ds-btn btn-b">B</div>
          </div>
        </div>

        {/* Start/Select */}
        <div className="ds-start-select">
          <div className="ds-small-btn select">SELECT</div>
          <div className="ds-small-btn start">START</div>
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
