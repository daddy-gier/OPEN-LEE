module.exports = {
  packagerConfig: {
    asar: true,
    icon: './assets/logo',
    name: 'OPEN-LEE',
    appBundleId: 'com.nyghtshade.openlee',
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'OPEN-LEE',
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          maintainer: 'daddy-gier',
          homepage: 'https://github.com/daddy-gier/open-lee',
        },
      },
    },
  ],
};
