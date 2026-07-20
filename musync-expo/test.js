const { render } = require('@testing-library/react-native');
const React = require('react');
const { View, Text } = require('react-native');
const result = render(React.createElement(View, null, React.createElement(Text, null, 'hello')));
console.log(Object.keys(result));
