import { useCallback } from "react";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";
import {
  useAppDispatch,
  useAppSelector,
  likeTrack,
  removeLikedTrack,
} from "@redux/exports";
import { useIsVirtual } from "@hooks/useIsVirtual";

export default function LikeButton({ trackId }: { trackId: string }) {
  const isLiked = useAppSelector(
    (s) => s.library.data.likedTracksLookup[trackId] !== undefined
  );

  const dispatch = useAppDispatch();

  const isVirtual = useIsVirtual(trackId,'track')

  const toggleState = useCallback(() => {
    if (isLiked) {
      dispatch(
        removeLikedTrack({
          track: trackId,
        })
      );
    } else {
      dispatch(
        likeTrack({
          track: trackId,
        })
      );
    }
  }, [dispatch, isLiked, trackId]);

  if(isVirtual){
    return null
  }

  return (
    <div className="like-icon" data-value={isLiked} onClick={toggleState}>
      {isLiked ? <AiFillHeart /> : <AiOutlineHeart />}
    </div>
  );
}
