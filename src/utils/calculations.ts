export const calculateDensity = (actualProcessWeight: number, secondProcessWeight: number) => {
    if (actualProcessWeight - secondProcessWeight === 0) return 0;
    return actualProcessWeight / (actualProcessWeight - secondProcessWeight);
};

export const calculatePurity = (density: number) => {
    if (density >= 19.3) return 99.9;
    if (density <= 10.5) return 0.0;
    
    // Physics-based interpolation with clamp
    const factor = (1/density - 1/10.5) / (1/19.3 - 1/10.5);
    return Math.max(0, Math.min(factor * 99.9, 99.9));
};

export const calculateTolaRate = (marketPrice: number, additions: number = 0) => {
    // Tola Rate (1/3 unit as per requirement)
    return (marketPrice + additions) / 3;
};

export const calculateSubtotal = (tolaRate: number, purity: number, weightInTolas: number) => {
    // Subtotal = (TolaRate * 3 * (Purity / 100)) * WeightInTolas
    // tolaRate * 3 = Price per 1 Tola
    return (tolaRate * 3 * (purity / 100)) * weightInTolas;
};
