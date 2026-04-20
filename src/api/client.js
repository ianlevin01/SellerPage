import axios from "axios";

const BASE = import.meta.env.VITE_API_URL || "";

const client = axios.create({
  baseURL: BASE,
  timeout: 20000,
});

export default client;
