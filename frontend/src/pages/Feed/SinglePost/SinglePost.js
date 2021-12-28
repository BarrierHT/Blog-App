import React, { Component } from 'react';

import Image from '../../../components/Image/Image';
import './SinglePost.css';

class SinglePost extends Component {
    state = {
        title: '',
        author: '',
        date: '',
        image: '',
        content: '',
    };

    componentDidMount() {
        //*Fetch a single post
        const postId = this.props.match.params.postId;

        const graphqlQuery = {
            query: `
                query($postId: ID!){
                    getPost(postId: $postId) 
                    { content title creator {name} createdAt imageUrl }
                }
            `,
            variables: {
                postId,
            },
        };

        fetch('http://localhost:8080/graphql', {
            method: 'POST',
            body: JSON.stringify(graphqlQuery),
            headers: {
                Authorization: 'Bearer ' + this.props.token,
                'Content-type': 'application/json',
            },
        })
            .then(res => {
                return res.json();
            })
            .then(resData => {
                if (resData.errors) throw new Error('Failed to fetch the post');

                console.log('res: ', resData);
                this.setState({
                    title: resData.data.getPost.title,
                    author: resData.data.getPost.creator.name,
                    date: new Date(
                        Number(resData.data.getPost.createdAt)
                    ).toLocaleDateString('en-US'),
                    image:
                        'http://localhost:8080/' +
                        resData.data.getPost.imageUrl,
                    content: resData.data.getPost.content,
                });
            })
            .catch(err => {
                console.log(err);
            });
    }

    render() {
        return (
            <section className="single-post">
                <h1>{this.state.title}</h1>
                <h2>
                    Created by {this.state.author} on {this.state.date}
                </h2>
                <div className="single-post__image">
                    <Image contain imageUrl={this.state.image} />
                </div>
                <p>{this.state.content}</p>
            </section>
        );
    }
}

export default SinglePost;
