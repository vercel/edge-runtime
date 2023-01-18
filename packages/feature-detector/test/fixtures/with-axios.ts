import axios from 'axios'

export default async function () {
  return axios.get('https://example.vercel.sh').then((res) => res.data)
}
