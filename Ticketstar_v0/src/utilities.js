export const formatTimes = (openTime, closeTime) => {
  if (!openTime || !closeTime) {
    return null;
  }

  const startDate = new Date(openTime);
  const endDate = new Date(closeTime);

  const dateOptions = { year: 'numeric', month: 'short', day: 'numeric' };
  const timeOptions = { hour: '2-digit', minute: '2-digit' };

  const startDateString = startDate.toLocaleDateString(undefined, dateOptions);
  const startTimeString = startDate.toLocaleTimeString(undefined, timeOptions);
  const endTimeString = endDate.toLocaleTimeString(undefined, timeOptions);

  return `${startDateString}, ${startTimeString} - ${endTimeString}`;
};


export const convertToGMT = epochTime => {
  const date = new Date(epochTime * 1000);
  return date.toUTCString();
};
