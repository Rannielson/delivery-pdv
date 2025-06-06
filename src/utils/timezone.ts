
export const getCurrentBrazilTime = () => {
  const now = new Date();
  // Converter para horário de São Paulo (UTC-3)
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const brazilTime = new Date(utc + (-3 * 3600000));
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
