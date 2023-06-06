let API_URL;
console.log("env word", process.env.REACT_APP_API_URL);
if (process.env.REACT_APP_API_URL === "production") {
  API_URL = process.env.REACT_APP_API_URL_LINK_EX;
} else {
  API_URL = process.env.REACT_APP_API_URL_LINK_IN;
}

export default {
  API_URL,
};
