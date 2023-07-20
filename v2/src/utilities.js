export const formatTimes = (openTime, closeTime) => {
  if (!openTime || !closeTime) {
    return null;
  }

  const startDate = new Date(openTime);
  const endDate = new Date(closeTime);

  const dateOptions = {year: 'numeric', month: 'short', day: 'numeric'};
  const timeOptions = {hour: '2-digit', minute: '2-digit'};

  const startDateString = startDate.toLocaleDateString(
    undefined,
    dateOptions,
  );
  const startTimeString = startDate.toLocaleTimeString(
    undefined,
    timeOptions,
  );
  const endTimeString = endDate.toLocaleTimeString(undefined, timeOptions);

  if (startDate.toDateString() === endDate.toDateString()) {
    return `${startDateString}, ${startTimeString} - ${endTimeString}`;
  } else {
    const endDateString = endDate.toLocaleDateString(undefined, dateOptions);
    return `${startDateString}, ${startTimeString} - ${endDateString}, ${endTimeString}`;
  }
};
