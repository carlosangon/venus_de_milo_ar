import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const THREE = require('three');
global.THREE = THREE;
require('./OBJLoader')
import ExpoTHREE from 'expo-three';
console.disableYellowBox = true;

export default class App extends React.Component {
  state = {
    loaded: false,
  }

  componentWillMount() {
    this.preloadAssetsAsync();
  }

  render() {
    return this.state.loaded ? (
      <View style={{ flex: 1 }}>
        <Expo.GLView
          ref={(ref) => this._glView = ref}
          style={{ flex: 1 }}
          onContextCreate={this._onGLContextCreate}
        />
      </View>
    ) : <Expo.AppLoading />;
  }

  async preloadAssetsAsync() {
    await Promise.all([
      require('./assets/venusAR.obj'),
      require('./assets/gold.jpg'),
    ].map((module) => Expo.Asset.fromModule(module).downloadAsync()));
    this.setState({ loaded: true });
  }

  _onGLContextCreate = async (gl) => {
    const width = gl.drawingBufferWidth;
    const height = gl.drawingBufferHeight;

    gl.createRenderbuffer = () => {};
    gl.bindRenderbuffer = () => {};
    gl.renderbufferStorage  = () => {};
    gl.framebufferRenderbuffer  = () => {};

     // ar init
    const arSession = await this._glView.startARSessionAsync();

    // three.js init
    const scene = new THREE.Scene();
    const camera = ExpoTHREE.createARCamera(
      arSession,
      gl.drawingBufferWidth,
      gl.drawingBufferHeight,
      0.01,
      2000
    );

    const renderer = ExpoTHREE.createRenderer({ gl });
    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
    scene.background = ExpoTHREE.createARBackgroundTexture(arSession, renderer);
    
    // lights
    const frontLight = new THREE.DirectionalLight(0xffffff, 0.3);
    frontLight.position.set(1, 1, 1);
    scene.add(frontLight);

    const backLight = new THREE.DirectionalLight(0xffffff, 0.1);
    backLight.position.set(-1, 0, -1);
    scene.add(backLight);

    const ambLight = new THREE.AmbientLight(0xd3d3d3, 0.5);
    scene.add(ambLight);

    // yellow lights

    const frontLeftLight = new THREE.DirectionalLight(0xFFAB00, 0.3);
    frontLeftLight.position.set(-3, 0, -3);
    scene.add(frontLeftLight);

    const frontRightLight = new THREE.DirectionalLight(0xFFAB00, 0.1);
    frontRightLight.position.set(-3, 0, 3);
    scene.add(frontRightLight);

    // venus material
    const venusMaterial =  new THREE.MeshPhongMaterial({
      color: 0xFFFFFF,
      specular: 0xf8f8f8,
      shininess: 1,
      reflectivity: 1,
      roughness: 2.5,
    });

    // venus model
    const modelAsset = Asset.fromModule(require('./assets/venusAR.obj'));
    await modelAsset.downloadAsync();

    const loader = new THREE.OBJLoader();

    const model = loader.parse(
      await Expo.FileSystem.readAsStringAsync(modelAsset.localUri))

      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = venusMaterial;
        }
      });

      model.position.y = -0.2;
      model.position.z = -0.7;

      model.scale.set(0.15, 0.15, 0.15);
      scene.add(model);

    // animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
      gl.endFrameEXP();
    }
    animate();
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

