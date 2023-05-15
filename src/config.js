let API_URL;
console.log("env word", process.env.REACT_APP_API_URL);
if (process.env.REACT_APP_API_URL === "production") {
  API_URL = "https://zcw74z8g88.execute-api.ap-southeast-2.amazonaws.com/test";
} else {
  API_URL = "http://localhost:5000/api/auth";
}

export default {
  API_URL,
};
