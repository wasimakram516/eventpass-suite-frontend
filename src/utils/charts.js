export const buildDonutData = (data = [], emptyLabel = "Empty", donutColors = [], donutEmpty = "#e0e0e0") => {
  const total = data.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
  if (total === 0) {
    return {
      data: [
        {
          id: 0,
          label: emptyLabel,
          value: 1,
          color: donutEmpty,
          isEmpty: true,
        },
      ],
      total: 0,
    };
  }
  return {
    data: data.map((item, idx) => ({
      id: idx,
      label: item.name,
      ...item,
      color: donutColors.length ? donutColors[idx % donutColors.length] : undefined,
    })),
    total,
  };
};