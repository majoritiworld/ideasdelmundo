const relaxedUrlRegex = /^(https?:\/\/)?(www\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[^\s]*)?$/;

export const isValidUrl = (url: string) => {
  return relaxedUrlRegex.test(url.trim());
};
