import { useCallback } from "react";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { likeTrack, removeLikedTrack } from "../redux/slices/library";

export default function LikeButton({ trackId }: { trackId: string }) {
  const isLiked = useAppSelector(
    (s) => s.library.data.likedTracksLookup[trackId] !== undefined
  );

  const dispatch = useAppDispatch();

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

  return (
    <div className="like-icon" data-value={isLiked} onClick={toggleState}>
      {isLiked ? <AiFillHeart /> : <AiOutlineHeart />}
    </div>
  );
}
