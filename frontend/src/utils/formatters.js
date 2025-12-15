export const formatCurrency = (amount) => `KSh ${Math.abs(amount).toLocaleString()}`;

export const createSmoothPath = (values, paddingLeft, chartWidth, paddingTop, chartHeight, yMax) => {
  if (!values || values.length === 0) return '';
  
  const points = values.map((val, i) => ({
    x: paddingLeft + (i / Math.max(1, values.length - 1)) * chartWidth,
    y: paddingTop + chartHeight - (val / yMax) * chartHeight
  }));
  
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    
    path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  return path;
};
