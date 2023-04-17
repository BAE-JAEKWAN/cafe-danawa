import { useEffect, useState } from "react";
import {
  Container as MapDiv,
  NaverMap,
  Marker,
  useNavermaps,
  InfoWindow,
} from "react-naver-maps";
import axios from "axios";
import "../App.css";

function Refactor() {
  const navermaps = useNavermaps(); //naver.maps 객체 생성
  const [map, setMap] = useState(null); // 지도 초기 위치 상태
  const [localLat, setLocalLat] = useState(null); // 현재 위치 x좌표 초기값
  const [localLng, setLocalLng] = useState(null); // 현재 위치 y좌표 초기값
  const [currentLocalAddress, setLocalAddress] = useState(null); // 현재 위치 상세 주소
  const [currentInfoWindow, setCurrentInfoWindow] = useState(null); // 현재 위치 정보창

  // 현재 위치 좌표 구하기
  const funcCurrentLocation = () => {
    console.log("현재 위치 좌표 구하기 실행");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // 위치 정보 가져오기 성공
        setLocalLat(position.coords.latitude);
        setLocalLng(position.coords.longitude);
        console.log("현재 위치 좌표 :", localLat, localLng);
      },
      (error) => {
        // 위치 정보 가져오기 실패
        console.log("현재 위치 좌표 불러오기 실패", error);
      }
    );
  };

  // 현재 위치 주소 구하기
  const funcCurrentAddress = () => {
    console.log("현재 위치 주소 구하기 실행");
    navermaps.Service.reverseGeocode(
      {
        location: new navermaps.LatLng(localLat, localLng),
      },
      function (status, response) {
        if (status !== navermaps.Service.Status.OK) {
          return alert("reverseGeocode 실행 오류!");
        }
        setLocalAddress(response.result.items[0].address);
      }
    );
  };

  // 현재 위치 주소를 infoWindow로 출력
  const funcCurrentInfoWindow = () => {
    console.log("현재 위치 주소 :", currentLocalAddress);
    if (currentInfoWindow) {
      console.log("currentInfoWindow 실행");
      currentInfoWindow.setContent(
        `<div style="padding:10px;">현재 위치 : ${currentLocalAddress}</div>`
      );
      currentInfoWindow.open(map, new navermaps.LatLng(localLat, localLng));
    }
  };

  // 카카오 로컬 API로부터 현재 위치 주변 400미터 이내의 카페 정보 받아오기
  const [cafeData, setCafeData] = useState([]); // 주변 카페 정보
  const params = {
    category_group_code: "CE7", //카페 카테고리 코드
    radius: 400, // 반경 설정
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
        // 중복되는 데이터는 삭제하고 새로운 데이터만 allData에 추가
        const newData = response.data.documents.filter(
          (newDoc) => !allData.some((prevDoc) => prevDoc.id === newDoc.id)
        );
        allData = [...allData, ...newData];
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
              setCafeData(() => [...data]);
            }
          }
        })();
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const [selectedMarker, setSelectedMarker] = useState(null);

  useEffect(() => {
    funcCurrentLocation();
    if (localLat && localLng) {
      funcCurrentAddress();
      getData();
    }
  }, [localLat, localLng]);

  useEffect(() => {
    funcCurrentInfoWindow();
  }, [currentLocalAddress]);

  useEffect(() => {
    console.log(`내 위치 주변 ${params.radius}m 내의 카페 정보 :`, cafeData);
  }, [cafeData]);

  useEffect(() => {
    // 상세정보 실행
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

  return (
    <div>
      <header>
        <h1>현재 위치 주변 카페 현황</h1>
      </header>
      <MapDiv style={{ width: "100%", height: "calc(100vh - 86px)" }}>
        {/* 초기 렌더링 시 현재 위치 좌표가 계산되면 지도 렌더링 */}
        {localLat && localLng && (
          <NaverMap
            defaultCenter={new navermaps.LatLng(localLat, localLng)}
            defaultZoom={17}
            ref={setMap}
          >
            <Marker
              defaultPosition={{ lat: localLat, lng: localLng }}
              icon={{
                content: `<div class="currentMarker"></div>`,
                origin: new window.naver.maps.Point(0, 0), // 이미지 원점 설정
                anchor: new window.naver.maps.Point(7.5, 7.5), // 이미지 중심점 설정
              }}
              clickable={false}
            />
            <InfoWindow
              ref={setCurrentInfoWindow}
              anchor={new window.naver.maps.Point(0, 0)}
            />
            {cafeData.map((el, index) => (
              <Marker
                key={index}
                position={
                  new navermaps.LatLng(parseFloat(el.y), parseFloat(el.x))
                }
                icon={{
                  content: `<button class="markerBox" title="${el.place_name}"></button>`,
                  origin: new window.naver.maps.Point(0, 0), // 이미지 원점 설정
                  anchor: new window.naver.maps.Point(15, 15), // 이미지 중심점 설정
                }}
                onClick={() => {
                  setSelectedMarker(el);
                }}
              />
            ))}
          </NaverMap>
        )}
      </MapDiv>
    </div>
  );
}

export default Refactor;
