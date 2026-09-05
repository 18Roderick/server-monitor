import { getServerDetail, getServers } from "@/api/servers";
import { queryOptions } from "@tanstack/react-query";


export const serverQueryOptions = queryOptions({
  queryKey: ["servers"],
  queryFn:() => getServers()
})


export const serverDetailOptions = (serverId:string) => {
  return  queryOptions({
    queryKey: ["servers", serverId],
    queryFn:() => getServerDetail(serverId)
  })
}