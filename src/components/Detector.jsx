import { useRef, useState, useEffect } from 'react';
import { pipeline, env } from '@xenova/transformers';
import { client } from '@gradio/client';

env.allowLocalModels = false;

import img1 from '../assets/cats.jpg';
import img2 from '../assets/image2.jpg';
import img3 from '../assets/image3.jpg';
import img4 from '../assets/image4.jpg';

const ObjectDetection = () => {
  const [status, setStatus] = useState(
    'You can upload an Image, or generate an image by typing a prompt in the text box.'
  );

  const [savedUrls, setSavedUrls] = useState([img1, img2, img3, img4]);
  const [text, setText] = useState('');

  const fileUpload = useRef();
  const imageContainer = useRef();

  const handleImageGeneration = async () => {
    const app = await client('ByteDance/SDXL-Lightning');
    setStatus('Generating image...');
    const result = await app.predict('/generate_image_1', [text, '1-Step']);

    const image = document.createElement('img');
    image.src = result.data[0].url;

    imageContainer.current.innerHTML = '';
    imageContainer.current.appendChild(image);
    setStatus('Image generated');
 
    handleSaveUrl(result.data[0].url);
    setText('');
    console.log(result.data[0].url);
  };

  const handleSaveUrl = (url) => {
    const existingUrls = getSavedUrlsFromLocalStorage();
    if (!existingUrls.includes(url)) {
      setSavedUrls([...savedUrls, url]);
      localStorage.setItem('savedUrls', JSON.stringify([...savedUrls, url]));
    }
  };

  const getSavedUrlsFromLocalStorage = () => {
    const storedUrls = localStorage.getItem('savedUrls');
    return storedUrls ? JSON.parse(storedUrls) : [];
  };

  useEffect(() => {
    const storedUrls = localStorage.getItem('savedUrls');
    if (storedUrls) {
      const parsedUrls = JSON.parse(storedUrls);
      setSavedUrls(parsedUrls);
    }
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = (e2) => {
      const image = document.createElement('img');
      image.onload = () => {
        if (image.naturalWidth < 750) {
          image.style.maxWidth = image.naturalWidth;
        } else {
          image.style.maxWidth = '750px';
        }
        if (image.naturalHeight < 750) {
          image.style.maxHeight = image.naturalHeight;
        } else {
          image.style.maxHeight = '750px';
        }
      };
      image.src = e2.target.result;

      imageContainer.current.innerHTML = '';
      imageContainer.current.appendChild(image);
      detect(image);
    };
    reader.readAsDataURL(file);
  };
  const handleImageClick = (event) => {
    const imageSrc = event.currentTarget.src;
    console.log(event);
    fetch(imageSrc)
      .then((response) => response.blob())
      .then((blob) => {
        const fakeFile = new File([blob], 'image.jpg', { type: 'image/jpeg' });

        const changeEvent = {
          target: {
            files: [fakeFile],
          },
        };

        handleFileChange(changeEvent);
      })
      .catch((error) => {
        console.error('Error fetching image:', error);
      });
  };

  const detect = async (file) => {
    const detector = await pipeline(
      'object-detection',
      'Xenova/detr-resnet-50'
    );

    setStatus('Detecting objects...');

    const output = await detector(file.src, {
      threshold: 0.9,
      percentage: true,
    });
    setStatus('Objects detected');

    output.forEach(renderBox);
  };

  const renderBox = ({ box, label }) => {
    const { xmax, xmin, ymax, ymin } = box;

    const color =
      '#' +
      Math.floor(Math.random() * 0xffffff)
        .toString(16)
        .padStart(6, 0);

    const image = imageContainer.current.querySelector('img');
    const width = image.offsetWidth;
    const height = image.offsetHeight;

    const boxElement = document.createElement('div');
    boxElement.className = 'bounding-box';
    Object.assign(boxElement.style, {
      position: 'absolute',
      border: `3px solid ${color}`,
      left: `${width * xmin}px`,
      top: `${height * ymin}px`,
      width: `${width * (xmax - xmin)}px`,
      height: `${height * (ymax - ymin)}px`,
    });

    const labelElement = document.createElement('div');
    labelElement.textContent = label;
    labelElement.className = 'bounding-box-label';
    Object.assign(labelElement.style, {
      position: 'absolute',
      color: '#fff',
      backgroundColor: color,
      padding: '2px',
      fontSize: '12px',
      bottom: '0',
    });

    boxElement.appendChild(labelElement);
    imageContainer.current.appendChild(boxElement);
  };

  return (
    <div className="App">
      <ul className="ImageList">
        <h3 className="note">Click on any Image to start detecting</h3>
        {savedUrls.map((url) => (
          <img
            onClick={handleImageClick}
            className="ImageItem"
            src={url}
            key={url}
          />
        ))}
      </ul>

      <h1>Image Generator/ Object Detector</h1>
      <p id="status">{status}</p>
      <input
        type="file"
        id="file-upload"
        ref={fileUpload}
        onChange={handleFileChange}
      />
      <div className="generateimage">
        <input
          type="text"
          placeholder="Enter text to generate Image"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="generateimagebtn" onClick={handleImageGeneration}>
          {' '}
          Generate Image
        </button>
      </div>

      <div id="image-container" ref={imageContainer}></div>
    </div>
  );
};

export default ObjectDetection;
