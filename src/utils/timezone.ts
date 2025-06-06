
export const getCurrentBrazilTime = () => {
  const now = new Date();
  // Converter para horário de Brasília (UTC-3)
  const brazilTime = new Date(now.getTime() - (3 * 60 * 60 * 1000));
  return brazilTime;
};

export const formatBrazilDateTime = (date: Date) => {
  const brazilTime = getCurrentBrazilTime();
  return {
    date: brazilTime.toISOString().split('T')[0],
    time: brazilTime.toTimeString().split(' ')[0].substring(0, 5),
    brazilDateTime: brazilTime.toISOString()
  };
};
