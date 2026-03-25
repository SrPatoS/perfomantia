import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const ServerContext = createContext<any>(null);

export function ServerProvider({ children }: { children: React.ReactNode }): any {
   const { token } = useAuth();
   const [servers, setServers] = useState<any[]>([]);
   const [currentServer, setCurrentServer] = useState<any>({ id: 'local', name: 'Servidor Local', host_url: window.location.origin, api_key: '' });

   useEffect(() => {
      if (!token) return;
      axios.get(`${window.location.origin}/api/settings/servers`, { headers: { Authorization: `Bearer ${token}` } })
           .then(res => {
              const localNode = { id: 'local', name: 'Servidor Local', host_url: window.location.origin, api_key: token };
              setServers([localNode, ...res.data]);
              setCurrentServer(localNode);
           }).catch(() => {});
   }, [token]);

   const reloadServers = async () => {
      if (!token) return;
      try {
         const res = await axios.get(`${window.location.origin}/api/settings/servers`, { headers: { Authorization: `Bearer ${token}` } });
         setServers([{ id: 'local', name: 'Servidor Local', host_url: window.location.origin, api_key: token }, ...res.data]);
      } catch (e) {}
   };

   return (
      <ServerContext.Provider value={{ servers, currentServer, setCurrentServer, reloadServers }}>
         {children}
      </ServerContext.Provider>
   );
}

export const useServer = () => useContext(ServerContext);
