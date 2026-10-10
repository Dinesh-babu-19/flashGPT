import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { dummyChats, dummyUserData } from "../assets/assets";
import axios from 'axios';
import toast from "react-hot-toast";

const rawServerUrl = import.meta.env.VITE_SERVER_URL || '';
axios.defaults.baseURL = rawServerUrl.endsWith('/') ? rawServerUrl.slice(0, -1) : rawServerUrl;


const AppContext = createContext()

export const AppContextProvider = ({ children })=>{

    const navigate = useNavigate()
    const [user, setUser] = useState(null);
    const [chats, setChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
    const [token, setToken] = useState(localStorage.getItem('token') || null)
    const [loadingUser, setLoadingUser] = useState(true)

    const fetchUser = async () => {
        try {
            const { data } = await axios.get('/api/user/data', {headers: {Authorization: token}})
            if(data.success){
                setUser(data.user)
            }else{
                toast.error(data.message)
                setToken(null)
                localStorage.removeItem('token')
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message)
            if(error.response?.status === 401){
                setToken(null)
                localStorage.removeItem('token')
            }
        }finally{
            setLoadingUser(false)
        }
    }

    const createNewChat = async () => {
        try {
            if(!user) return toast('Login to create a new chat.')
            navigate('/')
            await axios.get('/api/chat/create', {headers: {Authorization: token}})
            fetchUsersChats()
        } catch (error) {
            toast.error(error.message)
        }
    }

    const fetchUsersChats = async () => {
        try {
            const { data } = await axios.get('/api/chat/get', {headers: {Authorization: token}})
            if(data.success){
                setChats(data.chats)
                // If the user have no chats, create new one
                if(data.chats.length === 0){
                    await createNewChat();
                    return fetchUsersChats()
                }else{
                    setSelectedChat(data.chats[0])
                }
            }else{
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    useEffect(()=>{
        if(theme === 'dark'){
            document.documentElement.classList.add('dark');
        }else{
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme)
    },[theme])


    useEffect(()=>{
        if(user){
            fetchUsersChats()
        }else{
            setChats([])
            setSelectedChat(null)
        }
    },[user])

    useEffect(()=>{
        if(token){
            fetchUser()
        }else{
            setUser(null)
            setLoadingUser(false)
        }
    },[token])

    const value = {
        navigate, user, setUser, fetchUser, chats, setChats, selectedChat, setSelectedChat, theme, setTheme, createNewChat, loadingUser, fetchUsersChats, token, setToken, axios
    }

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    )
}

export const useAppContext = ()=> useContext(AppContext)