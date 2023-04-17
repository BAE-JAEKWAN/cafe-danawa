import { NaverMap, Marker } from "react-naver-maps";

function MyMap() {
  const navermaps = window.naver.maps; // window에 naver.maps 객체가 할당됩니다.

  return (
    <NaverMap
      id="map"
      style={{ width: "100%", height: "400px" }}
      defaultCenter={{ lat: 37.5666102, lng: 126.9783881 }} // 초기 중심 좌표
      defaultZoom={13} // 초기 줌 레벨
      navermaps={navermaps}
      clientId="p6cikodn76" // 발급받은 클라이언트 ID를 입력합니다.
      mapOptions={{ mapTypeId: "normal" }}
    >
      <Marker
        position={{ lat: 37.5666102, lng: 126.9783881 }}
        animation={navermaps.Animation.BOUNCE}
      />
    </NaverMap>
  );
}

export default MyMap;
