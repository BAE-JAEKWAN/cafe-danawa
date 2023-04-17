import { useState, useEffect } from "react";
import {
  Container as MapDiv,
  NaverMap,
  Marker,
  useNavermaps,
  InfoWindow,
} from "react-naver-maps";
import "../App.css";
import axios from "axios";

function Old() {
  const navermaps = useNavermaps(); //naver.maps 객체 생성
  const [map, setMap] = useState(null); // 지도 초기 위치 상태
  const [localLat, setLocalLat] = useState(37.5666791); // 현재 위치 x좌표 초기값
  const [localLng, setLocalLng] = useState(126.9782914); // 현재 위치 y좌표 초기값

  // 카카오 로컬 API로부터 현재 위치 주변의 카페 정보를 받아와서 cafeData에 저장하는 함수
  const [cafeData, setCafeData] = useState([]); // 주변 카페 정보
  const params = {
    category_group_code: "CE7", //카페 카테고리 코드
    radius: 200, // 반경 설정
    x: localLng,
    y: localLat,
    page: 1,
  };
  const headers = {
    Authorization: "KakaoAK 36bc1dfae15cdd50ef0fca451fbecbbd",
  };
  const getData = () => {
    let allData = [];
    const fetchData = async (pageNum) => {
      try {
        const response = await axios.get(
          "https://dapi.kakao.com/v2/local/search/category.json",
          {
            params: { ...params, page: pageNum },
            headers: headers,
          }
        );
        allData = [...allData, ...response.data.documents];
        console.log(allData);

        return {
          isEnd: response.data.meta.is_end, // true면 while문 탈출
          data: allData,
        };
      } catch (error) {
        console.error(error);
      }
    };

    axios
      .get("https://dapi.kakao.com/v2/local/search/category.json", {
        params,
        headers,
      })
      .then(() => {
        let isEnd = false;
        let pageNum = 1;
        (async () => {
          while (!isEnd) {
            const { isEnd: loopEnd, data } = await fetchData(pageNum);
            isEnd = loopEnd;
            pageNum++;
            if (isEnd) {
              setCafeData((prevState) => [...prevState, ...data]);
            }
          }
        })();
      })
      .catch((error) => {
        console.error(error);
      });
    console.log(localAddress, cafeData);
  };

  // 마커 클릭 시 카페 상세 정보창 노출
  const [selectedMarker, setSelectedMarker] = useState(null);
  useEffect(() => {
    if (selectedMarker) {
      const location = new navermaps.LatLng(
        parseFloat(selectedMarker.y),
        parseFloat(selectedMarker.x)
      );
      const infoWindow = new navermaps.InfoWindow({
        content: `
        <div class="cafeInfoWindow">
          <p>${selectedMarker.place_name}</p>
          <p>${selectedMarker.address_name}</p>
          <p>${selectedMarker.phone}</p>
        </div>
        `,
      });
      infoWindow.open(map, location);
    }
  }, [selectedMarker]);

  const [currentWindow, setCurrentWindow] = useState(null); // 현재 위치 정보창
  const [localName, setLocalName] = useState(null); // 현재 위치 지역 이름
  const [localAddress, setLocalAddress] = useState(null); // 현재 위치 상세 주소
  function onSuccessGeolocation(position) {
    // if (!map || !currentWindow) return;

    setLocalLat(position.coords.latitude);
    setLocalLng(position.coords.longitude);

    const location = new navermaps.LatLng(localLat, localLng);
    currentLocation(location); // 현재 지역 좌표값을 currentLocation 함수에 인자로 전달
    map.setCenter(location);
    map.setZoom(17);
    currentWindow.setContent(
      `<div style="padding:10px;">현재 위치 : ${localAddress}</div>`
    );
    currentWindow.open(map, location);
    console.log("현재위치: " + location.toString());
  }
  const currentLocation = (location) => {
    // 현재 위치 지역명 구하기
    navermaps.Service.reverseGeocode(
      {
        location: location,
      },
      function (status, response) {
        if (status !== navermaps.Service.Status.OK) {
          return alert("Something wrong!");
        }

        setLocalName(response.result.items[0].addrdetail.sigugun);
        setLocalAddress(response.result.items[0].address);
      }
    );
  };

  function onErrorGeolocation() {
    if (!map || !currentWindow) return;

    const center = map.getCenter();
    currentWindow.setContent(
      '<div style="padding:20px;">' +
        '<h5 style="margin-bottom:5px;color:#f00;">Geolocation failed!</h5>' +
        "latitude: " +
        center.lat() +
        "<br />longitude: " +
        center.lng() +
        "</div>"
    );
    currentWindow.open(map, center);
  }

  useEffect(() => {
    if (!map || !currentWindow) {
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        onSuccessGeolocation(position);
        getData();
      }, onErrorGeolocation);
    } else {
      var center = map.getCenter();
      currentWindow.setContent(
        '<div style="padding:20px;"><h5 style="margin-bottom:5px;color:#f00;">Geolocation not supported</h5></div>'
      );
      currentWindow.open(map, center);
    }
  }, [map, currentWindow, localName, localLat, localLng]);

  return (
    <div>
      <header>
        <h1>현재 위치 주변 카페 현황</h1>
      </header>

      <MapDiv style={{ width: "100%", height: "calc(100vh - 86px)" }}>
        <NaverMap
          defaultCenter={{ lat: localLat, lng: localLng }} // 초기 중심 좌표
          defaultZoom={1} // 초기 줌 레벨
          disableKineticPan={false} // 관성 드래그
          ref={setMap}
        >
          {cafeData.map((el, index) => (
            <Marker
              key={index}
              position={
                new navermaps.LatLng(parseFloat(el.y), parseFloat(el.x))
              }
              icon={{
                content: `<button class="markerBox" title="${el.place_name}"></button>`,
              }}
              onClick={() => {
                setSelectedMarker(el);
              }}
            />
          ))}

          <InfoWindow ref={setCurrentWindow} />
        </NaverMap>
      </MapDiv>
    </div>
  );
}

export default Old;
