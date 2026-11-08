import styled from 'styled-components';
import access400 from '../../assets/generated/access-screen-400.webp';
import access640 from '../../assets/generated/access-screen-640.webp';

const Shot = styled.img`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

/**
 * The client's own app screen (assets/phone-pr.png), cropped to the screen
 * by the media pipeline so it sits in the same CSS frame as the other mocks.
 */
export function ScreenAccess() {
  return (
    <Shot
      src={access640}
      srcSet={`${access400} 400w, ${access640} 640w`}
      sizes="(min-width: 1024px) 300px, 70vw"
      width={640}
      height={1387}
      alt=""
      loading="lazy"
      decoding="async"
      draggable={false}
    />
  );
}
