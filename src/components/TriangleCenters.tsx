import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Sparkles } from 'lucide-react';

type Point = {
  x: number;
  y: number;
};

type CenterType = 'centroid' | 'circumcenter' | 'incenter' | 'orthocenter';

const TriangleCenters = () => {
  const [points, setPoints] = useState([
    { x: 100, y: 300 },
    { x: 300, y: 300 },
    { x: 200, y: 100 }
  ]);
  const [selectedCenter, setSelectedCenter] = useState<CenterType>('centroid');
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [displayState, setDisplayState] = useState<number>(0); // 0: none, 1: intersections, 2: intersections+measurements
  const showIntersections = displayState > 0;
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

  const centerColors: Record<CenterType, string> = {
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

  const calculateCircumradius = () => {
    const [a, b, c] = points;
    const center = calculateCircumcenter();
    // Distance from center to any vertex (they should all be equal)
    return Math.sqrt(Math.pow(center.x - a.x, 2) + Math.pow(center.y - a.y, 2));
  };

  const calculateInradius = () => {
    const [a, b, c] = points;
    
    // Calculate side lengths
    const sideA = Math.sqrt(Math.pow(b.x - c.x, 2) + Math.pow(b.y - c.y, 2));
    const sideB = Math.sqrt(Math.pow(c.x - a.x, 2) + Math.pow(c.y - a.y, 2));
    const sideC = Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
    
    // Calculate semi-perimeter
    const s = (sideA + sideB + sideC) / 2;
    
    // Calculate area using Heron's formula
    const area = Math.sqrt(s * (s - sideA) * (s - sideB) * (s - sideC));
    
    // Inradius = Area / Semi-perimeter
    return area / s;
  };

  const center = useMemo(() => {
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
        return calculateCentroid();
    }
  }, [selectedCenter, points]);

  const currentCenter = center;

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

  const getOrthocenterRightAngles = () => {
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

    // Helper function to create right angle marks
    const createRightAngle = (vertex: Point, foot: Point, sidePoint1: Point, sidePoint2: Point) => {
      const size = 8; // Size of the right angle mark
      
      // Calculate vectors for the sides
      const sideVec = {
        x: sidePoint2.x - sidePoint1.x,
        y: sidePoint2.y - sidePoint1.y
      };
      const altVec = {
        x: vertex.x - foot.x,
        y: vertex.y - foot.y
      };
      
      // Normalize vectors
      const sideLength = Math.sqrt(sideVec.x * sideVec.x + sideVec.y * sideVec.y);
      const altLength = Math.sqrt(altVec.x * altVec.x + altVec.y * altVec.y);
      
      const sideDir = {
        x: sideVec.x / sideLength,
        y: sideVec.y / sideLength
      };
      const altDir = {
        x: altVec.x / altLength,
        y: altVec.y / altLength
      };
      
      // Create the right angle square
      return [
        // First side of the square
        {
          x1: foot.x,
          y1: foot.y,
          x2: foot.x + size * sideDir.x,
          y2: foot.y + size * sideDir.y
        },
        // Second side of the square
        {
          x1: foot.x + size * sideDir.x,
          y1: foot.y + size * sideDir.y,
          x2: foot.x + size * sideDir.x + size * altDir.x,
          y2: foot.y + size * sideDir.y + size * altDir.y
        },
        // Third side of the square
        {
          x1: foot.x + size * sideDir.x + size * altDir.x,
          y1: foot.y + size * sideDir.y + size * altDir.y,
          x2: foot.x + size * altDir.x,
          y2: foot.y + size * altDir.y
        },
        // Fourth side of the square
        {
          x1: foot.x + size * altDir.x,
          y1: foot.y + size * altDir.y,
          x2: foot.x,
          y2: foot.y
        }
      ];
    };

    return [
      ...createRightAngle(a, footA, b, c),
      ...createRightAngle(b, footB, c, a),
      ...createRightAngle(c, footC, a, b)
    ];
  };

  const getCircumcenterRightAngles = () => {
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

    // Find intersection points of perpendicular bisectors with sides
    const intersectAB = findIntersection(midAB, perpSlopeAB, a, slopeAB);
    const intersectBC = findIntersection(midBC, perpSlopeBC, b, slopeBC);
    const intersectCA = findIntersection(midCA, perpSlopeCA, c, slopeCA);

    // Helper function to create right angle squares
    const createRightAngle = (intersect: Point, sidePoint1: Point, sidePoint2: Point, perpSlope: number) => {
      const size = 6; // Reduced size to fit within triangle
      
      // Calculate vectors for the sides
      const sideVec = {
        x: sidePoint2.x - sidePoint1.x,
        y: sidePoint2.y - sidePoint1.y
      };
      const perpVec = {
        x: 1,
        y: perpSlope
      };
      
      // Normalize vectors
      const sideLength = Math.sqrt(sideVec.x * sideVec.x + sideVec.y * sideVec.y);
      const perpLength = Math.sqrt(perpVec.x * perpVec.x + perpVec.y * perpVec.y);
      
      const sideDir = {
        x: sideVec.x / sideLength,
        y: sideVec.y / sideLength
      };
      const perpDir = {
        x: perpVec.x / perpLength,
        y: perpVec.y / perpLength
      };
      
      // Calculate the center of the square
      const center = {
        x: intersect.x + (size * sideDir.x + size * perpDir.x) / 2,
        y: intersect.y + (size * sideDir.y + size * perpDir.y) / 2
      };
      
      // Check if the center is inside the triangle
      const isInside = (p: Point) => {
        const d1 = (p.x - b.x) * (c.y - b.y) - (p.y - b.y) * (c.x - b.x);
        const d2 = (p.x - c.x) * (a.y - c.y) - (p.y - c.y) * (a.x - c.x);
        const d3 = (p.x - a.x) * (b.y - a.y) - (p.y - a.y) * (b.x - a.x);
        return (d1 >= 0 && d2 >= 0 && d3 >= 0) || (d1 <= 0 && d2 <= 0 && d3 <= 0);
      };
      
      if (!isInside(center)) {
        // If the center is outside, flip the direction of the perpendicular vector
        perpDir.x = -perpDir.x;
        perpDir.y = -perpDir.y;
      }
      
      // Create the right angle square
      return [
        // First side of the square
        {
          x1: intersect.x,
          y1: intersect.y,
          x2: intersect.x + size * sideDir.x,
          y2: intersect.y + size * sideDir.y
        },
        // Second side of the square
        {
          x1: intersect.x + size * sideDir.x,
          y1: intersect.y + size * sideDir.y,
          x2: intersect.x + size * sideDir.x + size * perpDir.x,
          y2: intersect.y + size * sideDir.y + size * perpDir.y
        },
        // Third side of the square
        {
          x1: intersect.x + size * sideDir.x + size * perpDir.x,
          y1: intersect.y + size * sideDir.y + size * perpDir.y,
          x2: intersect.x + size * perpDir.x,
          y2: intersect.y + size * perpDir.y
        },
        // Fourth side of the square
        {
          x1: intersect.x + size * perpDir.x,
          y1: intersect.y + size * perpDir.y,
          x2: intersect.x,
          y2: intersect.y
        }
      ];
    };

    return [
      ...createRightAngle(intersectAB, a, b, perpSlopeAB),
      ...createRightAngle(intersectBC, b, c, perpSlopeBC),
      ...createRightAngle(intersectCA, c, a, perpSlopeCA)
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

  const getRightAngles = () => {
    switch (selectedCenter) {
      case 'orthocenter':
        return getOrthocenterRightAngles();
      case 'circumcenter':
        return getCircumcenterRightAngles();
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

  const getCentroidTickMarks = () => {
    const [a, b, c] = points;
    const midBC = { x: (b.x + c.x) / 2, y: (b.y + c.y) / 2 };
    const midCA = { x: (c.x + a.x) / 2, y: (c.y + a.y) / 2 };
    const midAB = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };

    // Calculate perpendicular directions for tick marks
    const getTickMarks = (p1: Point, p2: Point, mid: Point, numTicks: number) => {
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const length = 8; // Length of tick mark
      const spacing = 4; // Space between parallel tick marks
      
      // Perpendicular vector
      const perpX = -dy / Math.sqrt(dx * dx + dy * dy) * length;
      const perpY = dx / Math.sqrt(dx * dx + dy * dy) * length;
      
      const ticks = [];
      const totalWidth = (numTicks - 1) * spacing;
      
      for (let i = 0; i < numTicks; i++) {
        const offset = -totalWidth/2 + i * spacing;
        // Parallel vector for positioning
        const parX = dx / Math.sqrt(dx * dx + dy * dy) * offset;
        const parY = dy / Math.sqrt(dx * dx + dy * dy) * offset;
        
        ticks.push({
          x1: mid.x - perpX + parX,
          y1: mid.y - perpY + parY,
          x2: mid.x + perpX + parX,
          y2: mid.y + perpY + parY
        });
      }
      
      return ticks;
    };

    // Calculate midpoints of each half segment
    const midBmidBC = { x: (b.x + midBC.x) / 2, y: (b.y + midBC.y) / 2 };
    const midCmidBC = { x: (c.x + midBC.x) / 2, y: (c.y + midBC.y) / 2 };
    
    const midCmidCA = { x: (c.x + midCA.x) / 2, y: (c.y + midCA.y) / 2 };
    const midAmidCA = { x: (a.x + midCA.x) / 2, y: (a.y + midCA.y) / 2 };
    
    const midAmidAB = { x: (a.x + midAB.x) / 2, y: (a.y + midAB.y) / 2 };
    const midBmidAB = { x: (b.x + midAB.x) / 2, y: (b.y + midAB.y) / 2 };

    return [
      // One tick mark at both midpoints of BC
      ...getTickMarks(b, c, midBmidBC, 1),
      ...getTickMarks(b, c, midCmidBC, 1),
      
      // Two tick marks at both midpoints of CA
      ...getTickMarks(c, a, midCmidCA, 2),
      ...getTickMarks(c, a, midAmidCA, 2),
      
      // Three tick marks at both midpoints of AB
      ...getTickMarks(a, b, midAmidAB, 3),
      ...getTickMarks(a, b, midBmidAB, 3)
    ];
  };

  const getCircumcenterTickMarks = () => {
    const [a, b, c] = points;
    const midBC = { x: (b.x + c.x) / 2, y: (b.y + c.y) / 2 };
    const midCA = { x: (c.x + a.x) / 2, y: (c.y + a.y) / 2 };
    const midAB = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };

    // Calculate perpendicular directions for tick marks
    const getTickMarks = (p1: Point, p2: Point, mid: Point, numTicks: number) => {
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const length = 8; // Length of tick mark
      const spacing = 4; // Space between parallel tick marks
      
      // Perpendicular vector
      const perpX = -dy / Math.sqrt(dx * dx + dy * dy) * length;
      const perpY = dx / Math.sqrt(dx * dx + dy * dy) * length;
      
      const ticks = [];
      const totalWidth = (numTicks - 1) * spacing;
      
      for (let i = 0; i < numTicks; i++) {
        const offset = -totalWidth/2 + i * spacing;
        // Parallel vector for positioning
        const parX = dx / Math.sqrt(dx * dx + dy * dy) * offset;
        const parY = dy / Math.sqrt(dx * dx + dy * dy) * offset;
        
        ticks.push({
          x1: mid.x - perpX + parX,
          y1: mid.y - perpY + parY,
          x2: mid.x + perpX + parX,
          y2: mid.y + perpY + parY
        });
      }
      
      return ticks;
    };

    // Calculate midpoints of each half segment
    const midBmidBC = { x: (b.x + midBC.x) / 2, y: (b.y + midBC.y) / 2 };
    const midCmidBC = { x: (c.x + midBC.x) / 2, y: (c.y + midBC.y) / 2 };
    
    const midCmidCA = { x: (c.x + midCA.x) / 2, y: (c.y + midCA.y) / 2 };
    const midAmidCA = { x: (a.x + midCA.x) / 2, y: (a.y + midCA.y) / 2 };
    
    const midAmidAB = { x: (a.x + midAB.x) / 2, y: (a.y + midAB.y) / 2 };
    const midBmidAB = { x: (b.x + midAB.x) / 2, y: (b.y + midAB.y) / 2 };

    return [
      // One tick mark at both midpoints of BC
      ...getTickMarks(b, c, midBmidBC, 1),
      ...getTickMarks(b, c, midCmidBC, 1),
      
      // Two tick marks at both midpoints of CA
      ...getTickMarks(c, a, midCmidCA, 2),
      ...getTickMarks(c, a, midAmidCA, 2),
      
      // Three tick marks at both midpoints of AB
      ...getTickMarks(a, b, midAmidAB, 3),
      ...getTickMarks(a, b, midBmidAB, 3)
    ];
  };

  const getIncenterTickMarks = () => {
    const [a, b, c] = points;
    const center = calculateIncenter();

    // Helper function to calculate a point at a specific distance along a line
    const getPointAtDistance = (start: Point, end: Point, distance: number) => {
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      const ratio = distance / length;
      return {
        x: start.x + dx * ratio,
        y: start.y + dy * ratio
      };
    };

    // Helper function to create arc marks for angles
    const createAngleMark = (vertex: Point, p1: Point, p2: Point, numTicks: number) => {
      const radius = 20; // Radius of the arc
      const steps = 20; // Number of steps to create the arc
      const tickLength = 5; // Length of tick marks
      
      // Get points on each ray at fixed radius
      const point1 = getPointAtDistance(vertex, p1, radius);
      const point2 = getPointAtDistance(vertex, p2, radius);
      
      // Calculate vectors
      const v1x = point1.x - vertex.x;
      const v1y = point1.y - vertex.y;
      const v2x = point2.x - vertex.x;
      const v2y = point2.y - vertex.y;
      
      // Calculate angle between vectors
      let angle = Math.atan2(v2y, v2x) - Math.atan2(v1y, v1x);
      
      // Ensure we're measuring the interior angle
      if (angle > Math.PI) {
        angle = angle - 2 * Math.PI;
      } else if (angle < -Math.PI) {
        angle = angle + 2 * Math.PI;
      }
      
      // For interior angles, we want the smaller of the two possible angles
      if (Math.abs(angle) > Math.PI) {
        angle = angle > 0 ? -(2 * Math.PI - angle) : (2 * Math.PI + angle);
      }
      
      const angleStep = angle / steps;
      
      type ArcPoint = { x: number; y: number };
      type LineSegment = { x1: number; y1: number; x2: number; y2: number };
      
      // Generate points along the arc
      const points: ArcPoint[] = [];
      for (let i = 0; i <= steps; i++) {
        const currentAngle = Math.atan2(v1y, v1x) + angleStep * i;
        points.push({
          x: vertex.x + radius * Math.cos(currentAngle),
          y: vertex.y + radius * Math.sin(currentAngle)
        });
      }
      
      // Create line segments for the arc
      const segments: LineSegment[] = [];
      for (let i = 0; i < points.length - 1; i++) {
        segments.push({
          x1: points[i].x,
          y1: points[i].y,
          x2: points[i + 1].x,
          y2: points[i + 1].y
        });
      }

      // Add tick marks at two positions
      if (numTicks > 0) {
        // Calculate angles for the two sets of tick marks
        const angle1 = Math.atan2(v1y, v1x) + angle / 4; // First quarter of the angle
        const angle2 = Math.atan2(v1y, v1x) + (3 * angle) / 4; // Third quarter of the angle
        
        // Adjust tick spacing based on number of ticks and angle size
        // For smaller angles, we want closer spacing
        // For larger angles, we want wider spacing
        const baseSpacing = tickLength * 0.8; // Base spacing for multiple ticks
        const angleFactor = Math.min(1, Math.abs(angle) / (Math.PI / 2)); // Normalize angle to [0,1] range
        const tickSpacing = numTicks > 1 
          ? baseSpacing * (0.5 + angleFactor * 0.5) // Scale spacing based on angle size
          : tickLength * 1.5; // Keep single tick spacing constant
        
        // Function to add tick marks at a specific angle
        const addTickMarksAtAngle = (baseAngle: number) => {
          const totalWidth = (numTicks - 1) * tickSpacing;
          
          for (let i = 0; i < numTicks; i++) {
            const offset = -totalWidth/2 + i * tickSpacing;
            const tickAngle = baseAngle + offset / radius;
            
            const innerPoint = {
              x: vertex.x + (radius - tickLength/2) * Math.cos(tickAngle),
              y: vertex.y + (radius - tickLength/2) * Math.sin(tickAngle)
            };
            const outerPoint = {
              x: vertex.x + (radius + tickLength/2) * Math.cos(tickAngle),
              y: vertex.y + (radius + tickLength/2) * Math.sin(tickAngle)
            };
            
            segments.push({
              x1: innerPoint.x,
              y1: innerPoint.y,
              x2: outerPoint.x,
              y2: outerPoint.y
            });
          }
        };
        
        // Add tick marks at both positions
        addTickMarksAtAngle(angle1);
        addTickMarksAtAngle(angle2);
      }
      
      return segments;
    };

    return [
      // Angle marks at vertices with tick marks
      ...createAngleMark(a, b, c, 1), // One tick mark at vertex A
      ...createAngleMark(b, c, a, 2), // Two tick marks at vertex B
      ...createAngleMark(c, a, b, 3)  // Three tick marks at vertex C
    ];
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
            onChange={(e) => setSelectedCenter(e.target.value as CenterType)}
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
            {displayState === 2 && getRightAngles().map((angle, index) => (
              <line
                key={`right-angle-${index}`}
                x1={angle.x1}
                y1={angle.y1}
                x2={angle.x2}
                y2={angle.y2}
                stroke={centerColors[selectedCenter]}
                strokeWidth="1.5"
              />
            ))}
            
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
            
            {showIntersections && selectedCenter === 'circumcenter' && displayState === 2 && (
              <circle
                cx={currentCenter.x}
                cy={currentCenter.y}
                r={calculateCircumradius()}
                fill="none"
                stroke={centerColors[selectedCenter]}
                strokeWidth="1.5"
                opacity="0.7"
              />
            )}
            
            {showIntersections && selectedCenter === 'incenter' && displayState === 2 && (
              <circle
                cx={currentCenter.x}
                cy={currentCenter.y}
                r={calculateInradius()}
                fill="none"
                stroke={centerColors[selectedCenter]}
                strokeWidth="1.5"
                opacity="0.7"
              />
            )}
            
            {displayState === 2 && selectedCenter === 'centroid' && getCentroidTickMarks().map((tick, index) => (
              <line
                key={`tick-${index}`}
                x1={tick.x1}
                y1={tick.y1}
                x2={tick.x2}
                y2={tick.y2}
                stroke={centerColors[selectedCenter]}
                strokeWidth="1.5"
              />
            ))}
            
            {displayState === 2 && selectedCenter === 'circumcenter' && getCircumcenterTickMarks().map((tick, index) => (
              <line
                key={`tick-${index}`}
                x1={tick.x1}
                y1={tick.y1}
                x2={tick.x2}
                y2={tick.y2}
                stroke={centerColors[selectedCenter]}
                strokeWidth="1.5"
              />
            ))}
            
            {displayState === 2 && selectedCenter === 'incenter' && getIncenterTickMarks().map((tick, index) => (
              <line
                key={`tick-${index}`}
                x1={tick.x1}
                y1={tick.y1}
                x2={tick.x2}
                y2={tick.y2}
                stroke={centerColors[selectedCenter]}
                strokeWidth="1.5"
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
            onClick={() => setDisplayState((prev) => (prev + 1) % 3)}
            className="px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white text-sm font-semibold rounded-lg shadow-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            {displayState === 0 ? "Show Intersections" : 
             displayState === 1 ? "Show Intersections/Measurements" : 
             "Hide Intersections/Measurements"}
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