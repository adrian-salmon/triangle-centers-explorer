import React, { useState, useRef, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

const TriangleCenters = () => {
  const [points, setPoints] = useState([
    { x: 100, y: 300 },
    { x: 300, y: 300 },
    { x: 200, y: 100 }
  ]);
  const [selectedCenter, setSelectedCenter] = useState('centroid');
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showIntersections, setShowIntersections] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  // Helper function to find the intersection of two lines given by points and slopes
  const findIntersection = (p1: {x: number, y: number}, m1: number, p2: {x: number, y: number}, m2: number) => {
    // y = m1(x - p1.x) + p1.y
    // y = m2(x - p2.x) + p2.y
    // m1(x - p1.x) + p1.y = m2(x - p2.x) + p2.y
    // m1x - m1p1.x + p1.y = m2x - m2p2.x + p2.y
    // m1x - m2x = m1p1.x - m2p2.x - p1.y + p2.y
    // x(m1 - m2) = m1p1.x - m2p2.x - p1.y + p2.y
    const x = (m1 * p1.x - m2 * p2.x - p1.y + p2.y) / (m1 - m2);
    const y = m1 * (x - p1.x) + p1.y;
    return { x, y };
  };

  const centerColors = {
    centroid: '#FF6B6B',
    circumcenter: '#4ECDC4',
    incenter: '#45B7D1',
    orthocenter: '#FFA07A'
  };

  const calculateCentroid = () => {
    const x = (points[0].x + points[1].x + points[2].x) / 3;
    const y = (points[0].y + points[1].y + points[2].y) / 3;
    return { x, y };
  };

  const calculateCircumcenter = () => {
    const [a, b, c] = points;
    const d = 2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y));
    const x = ((a.x * a.x + a.y * a.y) * (b.y - c.y) + (b.x * b.x + b.y * b.y) * (c.y - a.y) + (c.x * c.x + c.y * c.y) * (a.y - b.y)) / d;
    const y = ((a.x * a.x + a.y * a.y) * (c.x - b.x) + (b.x * b.x + b.y * b.y) * (a.x - c.x) + (c.x * c.x + c.y * c.y) * (b.x - a.x)) / d;
    return { x, y };
  };

  const calculateIncenter = () => {
    const [a, b, c] = points;
    const abc = Math.sqrt((b.x - c.x) ** 2 + (b.y - c.y) ** 2);
    const bca = Math.sqrt((c.x - a.x) ** 2 + (c.y - a.y) ** 2);
    const cab = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
    const x = (abc * a.x + bca * b.x + cab * c.x) / (abc + bca + cab);
    const y = (abc * a.y + bca * b.y + cab * c.y) / (abc + bca + cab);
    return { x, y };
  };

  const calculateOrthocenter = () => {
    const [a, b, c] = points;
    
    // Calculate slopes of sides
    const slopeBC = (c.y - b.y) / ((c.x - b.x) || 0.001);
    const slopeCA = (a.y - c.y) / ((a.x - c.x) || 0.001);
    const slopeAB = (b.y - a.y) / ((b.x - a.x) || 0.001);

    // Calculate perpendicular slopes
    const perpSlopeA = -1 / (slopeBC || 0.001);
    const perpSlopeB = -1 / (slopeCA || 0.001);
    const perpSlopeC = -1 / (slopeAB || 0.001);

    // Find the feet of the altitudes (intersection points)
    const footA = findIntersection(
      a,
      perpSlopeA,
      b,
      slopeBC
    );

    // Use two altitudes to find the orthocenter
    const altitudeFromA = {
      slope: perpSlopeA,
      point: a
    };

    const altitudeFromB = {
      slope: perpSlopeB,
      point: b
    };

    // Find intersection of two altitudes to get orthocenter
    const orthocenter = findIntersection(
      altitudeFromA.point,
      altitudeFromA.slope,
      altitudeFromB.point,
      altitudeFromB.slope
    );

    return orthocenter;
  };

  const getCenter = () => {
    switch (selectedCenter) {
      case 'centroid':
        return calculateCentroid();
      case 'circumcenter':
        return calculateCircumcenter();
      case 'incenter':
        return calculateIncenter();
      case 'orthocenter':
        return calculateOrthocenter();
      default:
        return { x: 0, y: 0 };
    }
  };

  const center = getCenter();
  
  const getCentroidLines = () => {
    const [a, b, c] = points;

    // Calculate midpoints of each side
    const midBC = { x: (b.x + c.x) / 2, y: (b.y + c.y) / 2 };
    const midCA = { x: (c.x + a.x) / 2, y: (c.y + a.y) / 2 };
    const midAB = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };

    return [
      { x1: a.x, y1: a.y, x2: midBC.x, y2: midBC.y },
      { x1: b.x, y1: b.y, x2: midCA.x, y2: midCA.y },
      { x1: c.x, y1: c.y, x2: midAB.x, y2: midAB.y }
    ];
  };
  
  const getCircumcenterLines = () => {
    const [a, b, c] = points;
    const midAB = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const midBC = { x: (b.x + c.x) / 2, y: (b.y + c.y) / 2 };
    const midCA = { x: (c.x + a.x) / 2, y: (c.y + a.y) / 2 };
    
    const slopeAB = (b.y - a.y) / (b.x - a.x || 0.001);
    const slopeBC = (c.y - b.y) / (c.x - b.x || 0.001);
    const slopeCA = (a.y - c.y) / (a.x - c.x || 0.001);
    
    const perpSlopeAB = -1 / (slopeAB || 0.001);
    const perpSlopeBC = -1 / (slopeBC || 0.001);
    const perpSlopeCA = -1 / (slopeCA || 0.001);
    
    const center = calculateCircumcenter();

    // Extend the lines in both directions
    const extendLine = (start: {x: number, y: number}, end: {x: number, y: number}, factor: number = 100) => {
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      return {
        x: end.x + dx * factor,
        y: end.y + dy * factor
      };
    };

    // Extend from midpoints through center
    const extendedAB = extendLine(midAB, center);
    const extendedBC = extendLine(midBC, center);
    const extendedCA = extendLine(midCA, center);

    // Extend in opposite direction
    const extendedStartAB = extendLine(center, midAB, 100);
    const extendedStartBC = extendLine(center, midBC, 100);
    const extendedStartCA = extendLine(center, midCA, 100);
    
    return [
      { x1: extendedStartAB.x, y1: extendedStartAB.y, x2: extendedAB.x, y2: extendedAB.y },
      { x1: extendedStartBC.x, y1: extendedStartBC.y, x2: extendedBC.x, y2: extendedBC.y },
      { x1: extendedStartCA.x, y1: extendedStartCA.y, x2: extendedCA.x, y2: extendedCA.y }
    ];
  };
  
  const getIncenterLines = () => {
    const [a, b, c] = points;
    const center = calculateIncenter();
    return [
      { x1: a.x, y1: a.y, x2: center.x, y2: center.y },
      { x1: b.x, y1: b.y, x2: center.x, y2: center.y },
      { x1: c.x, y1: c.y, x2: center.x, y2: center.y }
    ];
  };
  
  const getOrthocenterLines = () => {
    const [a, b, c] = points;
    
    // Calculate slopes of sides
    const slopeBC = (c.y - b.y) / ((c.x - b.x) || 0.001);
    const slopeCA = (a.y - c.y) / ((a.x - c.x) || 0.001);
    const slopeAB = (b.y - a.y) / ((b.x - a.x) || 0.001);

    // Calculate perpendicular slopes
    const perpSlopeA = -1 / (slopeBC || 0.001);
    const perpSlopeB = -1 / (slopeCA || 0.001);
    const perpSlopeC = -1 / (slopeAB || 0.001);

    // Find the feet of the altitudes (intersection points)
    const footA = findIntersection(
      a,
      perpSlopeA,
      b,
      slopeBC
    );

    const footB = findIntersection(
      b,
      perpSlopeB,
      c,
      slopeCA
    );

    const footC = findIntersection(
      c,
      perpSlopeC,
      a,
      slopeAB
    );

    // Extend the lines a bit beyond the triangle for better visualization
    const extendLine = (start: {x: number, y: number}, end: {x: number, y: number}, factor: number = 100) => {
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      return {
        x: end.x + dx * factor,
        y: end.y + dy * factor
      };
    };

    const extendedFootA = extendLine(a, footA);
    const extendedFootB = extendLine(b, footB);
    const extendedFootC = extendLine(c, footC);

    // Also extend in the opposite direction with the same large factor
    const extendedStartA = extendLine(footA, a, 100);
    const extendedStartB = extendLine(footB, b, 100);
    const extendedStartC = extendLine(footC, c, 100);

    return [
      { x1: extendedStartA.x, y1: extendedStartA.y, x2: extendedFootA.x, y2: extendedFootA.y },
      { x1: extendedStartB.x, y1: extendedStartB.y, x2: extendedFootB.x, y2: extendedFootB.y },
      { x1: extendedStartC.x, y1: extendedStartC.y, x2: extendedFootC.x, y2: extendedFootC.y }
    ];
  };
  
  const getIntersectionLines = () => {
    switch (selectedCenter) {
      case 'centroid':
        return getCentroidLines();
      case 'circumcenter':
        return getCircumcenterLines();
      case 'incenter':
        return getIncenterLines();
      case 'orthocenter':
        return getOrthocenterLines();
      default:
        return [];
    }
  };

  const handlePointDrag = (index: number, e: MouseEvent) => {
    if (!isDragging || !svgRef.current) return;
    const svgRect = svgRef.current.getBoundingClientRect();
    const newPoints = [...points];
    newPoints[index] = {
      x: Math.max(0, Math.min(400, e.clientX - svgRect.left)),
      y: Math.max(0, Math.min(400, e.clientY - svgRect.top))
    };
    setPoints(newPoints);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && hoveredPoint !== null) {
        handlePointDrag(hoveredPoint, e);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, hoveredPoint]);

  const centerInfo = {
    centroid: "The centroid is the arithmetic mean position of all points in the triangle. It's where the medians intersect!",
    circumcenter: "The circumcenter is equidistant from all vertices. It's where the perpendicular bisectors meet!",
    incenter: "The incenter is equidistant from all sides. It's where the angle bisectors intersect!",
    orthocenter: "The orthocenter is where the three altitudes of the triangle intersect. Cool, right?"
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-white">
      <div className="bg-white p-4 rounded-lg shadow-lg w-[500px] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <h2 className="text-xl font-bold mb-3 text-center text-gray-800 flex items-center justify-center">
          <Sparkles className="mr-2 h-5 w-5" /> Triangle Centers Explorer <Sparkles className="ml-2 h-5 w-5" />
        </h2>
        <div className="mb-3 flex justify-center">
          <select
            value={selectedCenter}
            onChange={(e) => setSelectedCenter(e.target.value)}
            className="px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            <option value="centroid">Centroid</option>
            <option value="circumcenter">Circumcenter</option>
            <option value="incenter">Incenter</option>
            <option value="orthocenter">Orthocenter</option>
          </select>
        </div>
        <div className="text-center mb-2">
          <p className="text-sm font-semibold text-blue-600">Drag the blue points to explore!</p>
        </div>
        <div className="relative">
          <svg width="400" height="400" className="mx-auto border-2 border-gray-200 rounded-lg" ref={svgRef}>
            <polygon
              points={`${points[0].x},${points[0].y} ${points[1].x},${points[1].y} ${points[2].x},${points[2].y}`}
              fill="rgba(147, 197, 253, 0.3)"
              stroke="#3B82F6"
              strokeWidth="2"
            />
            
            {showIntersections && getIntersectionLines().map((line, index) => (
              <line
                key={`line-${index}`}
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                stroke={centerColors[selectedCenter]}
                strokeWidth="1.5"
                strokeDasharray="5,3"
                opacity="0.7"
              />
            ))}
            
            {points.map((point, index) => (
              <circle
                key={index}
                cx={point.x}
                cy={point.y}
                r="6"
                fill={hoveredPoint === index ? '#60A5FA' : '#3B82F6'}
                stroke={hoveredPoint === index ? '#2563EB' : 'none'}
                strokeWidth="2"
                onMouseEnter={() => setHoveredPoint(index)}
                onMouseLeave={() => !isDragging && setHoveredPoint(null)}
                onMouseDown={() => {
                  setIsDragging(true);
                  setHoveredPoint(index);
                }}
                style={{ cursor: 'pointer' }}
              />
            ))}
            <circle cx={center.x} cy={center.y} r="4" fill={centerColors[selectedCenter]} />
          </svg>
        </div>
        <div className="mt-3 flex justify-center">
          <button 
            onClick={() => setShowIntersections(!showIntersections)}
            className="px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white text-sm font-semibold rounded-lg shadow-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            {showIntersections ? "Hide Intersections" : "Show Intersections"}
          </button>
        </div>
        <div className="mt-2 p-2 bg-gray-100 rounded-lg">
          <p className="text-sm text-gray-700">{centerInfo[selectedCenter]}</p>
        </div>
      </div>
    </div>
  );
};

export default TriangleCenters; 