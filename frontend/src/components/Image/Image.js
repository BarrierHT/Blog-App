import React from 'react';

import './Image.css';

const image = props => (
    <div
        className="image"
        style={{
            backgroundImage: `url('${props.imageUrl}')`,
            backgroundSize: props.contain ? 'contain' : 'cover',
            backgroundPosition: props.left ? 'left' : 'center',
        }}
        //* title={props.imageUrl}
    />
);

export default image;
