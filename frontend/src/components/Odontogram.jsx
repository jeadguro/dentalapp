// src/components/Odontogram.jsx
import React, { useState } from "react";
import "./odontogram.css";

// Estados/condiciones de los dientes con sus colores
const TOOTH_CONDITIONS = {
  healthy: { label: "Sano", color: "#ffffff", textColor: "#333" },
  caries: { label: "Caries", color: "#8B0000", textColor: "#fff" },
  resin: { label: "Resina", color: "#00BFFF", textColor: "#fff" },
  amalgam: { label: "Amalgama", color: "#4B0082", textColor: "#fff" },
  resinCaries: { label: "Resina Fracturada c/Caries", color: "#006400", textColor: "#fff" },
  pulpectomy: { label: "Pulpectomía", color: "#0000CD", textColor: "#fff" },
  sealant: { label: "Sellador", color: "#9ACD32", textColor: "#333" },
  inlay: { label: "Incrustación", color: "#2F4F4F", textColor: "#fff" },
  endodontics: { label: "Endodoncia", color: "#DAA520", textColor: "#333" },
  hypoplasia: { label: "Hipoplasia", color: "#DEB887", textColor: "#333" },
  attrition: { label: "Atrición", color: "#8B4513", textColor: "#fff" },
  extrusion: { label: "Extrusión", color: "#FF8C00", textColor: "#fff" },
  teracal: { label: "Curación con Teracal", color: "#F0E68C", textColor: "#333" },
  implant: { label: "Implante", color: "#FF1493", textColor: "#fff" },
  extraction: { label: "Extracción indicada", color: "#FF0000", textColor: "#fff" },
  absent: { label: "Ausente", color: "#000000", textColor: "#fff" },
};

// Superficies de cada diente
const SURFACE_LABELS = {
  top: "Oclusal/Incisal",
  left: "Mesial",
  center: "Centro",
  right: "Distal",
  bottom: "Vestibular"
};

// Dientes por cuadrante (Sistema FDI)
const QUADRANTS = {
  upperRight: [18, 17, 16, 15, 14, 13, 12, 11],
  upperLeft: [21, 22, 23, 24, 25, 26, 27, 28],
  lowerLeft: [31, 32, 33, 34, 35, 36, 37, 38],
  lowerRight: [48, 47, 46, 45, 44, 43, 42, 41],
};

// Componente de un diente individual
const Tooth = ({ number, data, onSurfaceClick, readOnly }) => {
  const toothData = data[number] || {};

  const handleClick = (surface, e) => {
    e.stopPropagation();
    if (!readOnly && onSurfaceClick) {
      onSurfaceClick(number, surface);
    }
  };

  const getSurfaceStyle = (surface) => {
    const condition = toothData[surface];
    if (condition && TOOTH_CONDITIONS[condition]) {
      return {
        backgroundColor: TOOTH_CONDITIONS[condition].color,
      };
    }
    return { backgroundColor: "#fff" };
  };

  const isAbsent = toothData.center === 'absent' || toothData.whole === 'absent';

  return (
    <div className={`tooth-unit ${isAbsent ? 'absent' : ''} ${readOnly ? 'readonly' : ''}`}>
      <span className="tooth-num">{number}</span>
      <div className="tooth-diagram">
        <div 
          className="surface s-top" 
          style={getSurfaceStyle('top')}
          onClick={(e) => handleClick('top', e)}
        />
        <div className="surface-row">
          <div 
            className="surface s-left" 
            style={getSurfaceStyle('left')}
            onClick={(e) => handleClick('left', e)}
          />
          <div 
            className="surface s-center" 
            style={getSurfaceStyle('center')}
            onClick={(e) => handleClick('center', e)}
          />
          <div 
            className="surface s-right" 
            style={getSurfaceStyle('right')}
            onClick={(e) => handleClick('right', e)}
          />
        </div>
        <div 
          className="surface s-bottom" 
          style={getSurfaceStyle('bottom')}
          onClick={(e) => handleClick('bottom', e)}
        />
      </div>
    </div>
  );
};

// Componente principal del Odontograma
export default function Odontogram({ value = {}, onChange, readOnly = false }) {
  const [selectedCondition, setSelectedCondition] = useState('caries');

  const handleSurfaceClick = (toothNumber, surface) => {
    if (readOnly || !onChange) return;

    const newValue = JSON.parse(JSON.stringify(value));
    if (!newValue[toothNumber]) {
      newValue[toothNumber] = {};
    }

    // Toggle: si ya tiene la misma condición, la quita
    if (newValue[toothNumber][surface] === selectedCondition) {
      delete newValue[toothNumber][surface];
      if (Object.keys(newValue[toothNumber]).length === 0) {
        delete newValue[toothNumber];
      }
    } else {
      newValue[toothNumber][surface] = selectedCondition;
    }

    onChange(newValue);
  };

  const clearAll = () => {
    if (onChange) onChange({});
  };

  return (
    <div className="odontogram-pro">
      {/* Selector de condición */}
      {!readOnly && (
        <div className="condition-panel">
          <div className="panel-header">
            <span>Seleccionar condición:</span>
            <button type="button" className="btn-clear" onClick={clearAll}>
              Limpiar todo
            </button>
          </div>
          <div className="conditions-list">
            {Object.entries(TOOTH_CONDITIONS).map(([key, { label, color, textColor }]) => (
              <button
                key={key}
                type="button"
                className={`cond-btn ${selectedCondition === key ? 'selected' : ''}`}
                onClick={() => setSelectedCondition(key)}
              >
                <span 
                  className="cond-color" 
                  style={{ backgroundColor: color }}
                />
                <span className="cond-label">{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Odontograma Chart */}
      <div className="odonto-chart">
        {/* Encabezado */}
        <div className="chart-header">
          <span>Derecha</span>
          <span className="chart-title">ODONTOGRAMA</span>
          <span>Izquierda</span>
        </div>

        {/* Arcada Superior */}
        <div className="dental-arch upper">
          <div className="arch-row">
            {QUADRANTS.upperRight.map(num => (
              <Tooth key={num} number={num} data={value} onSurfaceClick={handleSurfaceClick} readOnly={readOnly} />
            ))}
            <div className="arch-midline" />
            {QUADRANTS.upperLeft.map(num => (
              <Tooth key={num} number={num} data={value} onSurfaceClick={handleSurfaceClick} readOnly={readOnly} />
            ))}
          </div>
        </div>

        {/* Separador */}
        <div className="arch-separator">
          <div className="sep-line" />
        </div>

        {/* Arcada Inferior */}
        <div className="dental-arch lower">
          <div className="arch-row">
            {QUADRANTS.lowerRight.map(num => (
              <Tooth key={num} number={num} data={value} onSurfaceClick={handleSurfaceClick} readOnly={readOnly} />
            ))}
            <div className="arch-midline" />
            {QUADRANTS.lowerLeft.map(num => (
              <Tooth key={num} number={num} data={value} onSurfaceClick={handleSurfaceClick} readOnly={readOnly} />
            ))}
          </div>
        </div>
      </div>

      {/* Leyenda */}
      <div className="odonto-legend">
        <h4>Referencias</h4>
        <div className="legend-grid">
          {Object.entries(TOOTH_CONDITIONS).slice(1).map(([key, { label, color }]) => (
            <div key={key} className="legend-item">
              <span className="legend-box" style={{ backgroundColor: color }} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Resumen */}
      {Object.keys(value).length > 0 && (
        <div className="odonto-findings">
          <h4>Hallazgos Registrados</h4>
          <div className="findings-list">
            {Object.entries(value).map(([tooth, surfaces]) => (
              <div key={tooth} className="finding-item">
                <strong>#{tooth}</strong>
                <div className="finding-details">
                  {Object.entries(surfaces).map(([surface, condition]) => (
                    <span key={surface} className="finding-tag" style={{ 
                      backgroundColor: TOOTH_CONDITIONS[condition]?.color,
                      color: TOOTH_CONDITIONS[condition]?.textColor 
                    }}>
                      {SURFACE_LABELS[surface]?.split('/')[0]}: {TOOTH_CONDITIONS[condition]?.label}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!readOnly && (
        <p className="odonto-help">
          Selecciona una condición y haz clic en las superficies de cada diente. 
          Clic de nuevo para desmarcar.
        </p>
      )}
    </div>
  );
}
