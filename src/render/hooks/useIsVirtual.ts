import { useAppSelector } from "@redux/hooks";


export function useIsVirtual(id: string,type: 'track' | 'album' | 'playlist' | 'artists' = 'track'){
    const toCheck = useAppSelector((a) => {
        if(type === 'album'){
            return a.library.data.albums
        }

        if(type === 'playlist') {
            return a.library.data.playlists
        }

        if(type === 'track'){
            return a.library.data.tracks
        }

        return a.library.data.artists
    })


    return toCheck[id] === undefined
}