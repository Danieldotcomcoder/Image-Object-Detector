import { useRef, useState } from 'react';
import {
  pipeline,
  env,
} from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.6.0';

env.allowLocalModels = false;
import img1 from '../assets/cats.jpg';
import img2 from '../assets/image2.jpg';
import img3 from '../assets/image3.jpg';
import img4 from '../assets/image4.jpg';

const ObjectDetection = () => {
  const [status, setStatus] = useState('Please Upload an Image, or click on one the available images on the left to analyze');

  const fileUpload = useRef();
  const imageContainer = useRef();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = (e2) => {
      const image = document.createElement('img');
      image.onload = () => {
        console.log('Image width:', image.naturalWidth);
        console.log('Image height:', image.naturalHeight);
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
  
    // Create a Blob from the image source URL
    fetch(imageSrc)
      .then((response) => response.blob())
      .then((blob) => {
        const fakeFile = new File([blob], 'image.jpg', { type: 'image/jpeg' });
        
        // Create a new object that mimics the structure of an event
        const changeEvent = {
          target: {
            files: [fakeFile]
          }
        };
        
        // Dispatch the event
        handleFileChange(changeEvent);
      })
      .catch((error) => {
        console.error('Error fetching image:', error);
        // Handle any errors here
      });
  }
  
  const detect = async (file) => {
    const detector = await pipeline(
      'object-detection',
      'Xenova/detr-resnet-50'
    );

    setStatus('Analysing...');

    const output = await detector(file.src, {
      threshold: 0.5,
      percentage: true,
    });
    setStatus('');
    console.log(output);

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
      <div className="ImageList">
        <img
          className="ImageItem"
          src={img1}
          alt=""
          onClick={handleImageClick}
        />
        <img
          className="ImageItem"
          src={img2}
          alt=""
          onClick={handleImageClick}
        />
        <img
          className="ImageItem"
          src={img3}
          alt=""
          onClick={handleImageClick}
        />
        <img
          className="ImageItem"
          src={img4}
          alt=""
          onClick={handleImageClick}
        />
      </div>
      <h1>Image Object Detection</h1>
      <p id="status">{status}</p>
      <input
        type="file"
        id="file-upload"
        ref={fileUpload}
        onChange={handleFileChange}
      />
      <div id="image-container" ref={imageContainer}></div>
    </div>
  );
};

export default ObjectDetection;
