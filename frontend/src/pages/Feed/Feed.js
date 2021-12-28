import React, { Component, Fragment } from 'react';

import Post from '../../components/Feed/Post/Post';
import Button from '../../components/Button/Button';
import FeedEdit from '../../components/Feed/FeedEdit/FeedEdit';
import Input from '../../components/Form/Input/Input';
import Paginator from '../../components/Paginator/Paginator';
import Loader from '../../components/Loader/Loader';
import ErrorHandler from '../../components/ErrorHandler/ErrorHandler';
import './Feed.css';

class Feed extends Component {
    state = {
        isEditing: false,
        posts: [],
        totalPosts: 0,
        editPost: null,
        status: '',
        postPage: 1,
        postsLoading: true,
        editLoading: false,
    };

    componentDidMount() {
        const graphqlQuery = {
            query: `
                query{
                    getUser{status password name}
                }
            `,
        };

        fetch('http://localhost:8080/graphql', {
            method: 'POST',
            headers: {
                Authorization: 'Bearer ' + this.props.token,
                'Content-type': 'application/json',
            },
            body: JSON.stringify(graphqlQuery),
        })
            .then(res => {
                return res.json();
            })
            .then(resData => {
                if (resData.errors) {
                    throw new Error('Failed to fetch user status.');
                }
                console.log(resData.data.getUser);
                this.setState({ status: resData.data.getUser.status });
            })
            .catch(this.catchError);

        this.loadPosts();
    }

    loadPosts = direction => {
        //*Load posts from server
        if (direction) {
            this.setState({ postsLoading: true, posts: [] });
        }
        let page = this.state.postPage;
        if (direction === 'next') {
            page++;
            this.setState({ postPage: page });
        }
        if (direction === 'previous') {
            page--;
            this.setState({ postPage: page });
        }

        const graphqlQuery = {
            query: `
                query($page: Int){
                    getPosts(page: $page) 
                    { posts{_id title createdAt creator{name} content imageUrl} totalItems }
                }
            `,
            variables: {
                page,
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
                if (resData.errors) {
                    throw new Error('Failed to fetch posts.');
                }
                console.log('res: ', resData);
                this.setState({
                    posts: resData.data.getPosts.posts.map(post => {
                        post.createdAt = new Date(Number(post.createdAt));
                        return {
                            ...post,
                            imagePath: post.imageUrl, //ImagePath to conserve the url
                        };
                    }),
                    totalPosts: resData.data.getPosts.totalItems,
                    postsLoading: false,
                });
            })
            .catch(this.catchError);
    };

    statusUpdateHandler = event => {
        event.preventDefault();
        console.log(this.state.status);

        const graphqlQuery = {
            query: `
                mutation ($status: String!){
                    updateStatus(status:$status)
                }
            `,
            variables: {
                status: this.state.status,
            },
        };

        fetch('http://localhost:8080/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + this.props.token,
            },
            body: JSON.stringify(graphqlQuery),
        })
            .then(res => {
                return res.json();
            })
            .then(resData => {
                if (resData.errors) {
                    throw new Error("Can't update status!");
                }
                console.log(resData);
            })
            .catch(this.catchError);
    };

    newPostHandler = () => {
        this.setState({ isEditing: true });
    };

    startEditPostHandler = postId => {
        this.setState(prevState => {
            const loadedPost = {
                ...prevState.posts.find(p => p._id === postId),
            };

            return {
                isEditing: true,
                editPost: loadedPost,
            };
        });
    };

    cancelEditHandler = () => {
        this.setState({ isEditing: false, editPost: null });
    };

    finishEditHandler = postData => {
        //*Edit or create a new post to the server
        this.setState({
            editLoading: true,
        });

        const formData = new FormData();
        formData.append('image', postData.image);

        if (this.state.editPost)
            formData.append('oldPath', this.state.editPost.imagePath);

        console.log(formData);

        fetch('http://localhost:8080/upload-image', {
            method: 'PUT',
            headers: {
                Authorization: 'Bearer ' + this.props.token,
            },
            body: formData,
        })
            .then(res => res.json())
            .then(resData => {
                const imageUrl = resData.filePath || 'undefined';

                let url = 'http://localhost:8080/graphql';
                let method = 'POST';
                let graphqlQuery = {
                    query: `
                    mutation ($title: String!, $content: String!, $imageUrl: String!){
                        createPost(title: $title, content: $content, imageUrl: $imageUrl)               
                        { 
                            _id title content creator{ name } createdAt imageUrl
                        }
                    }
                `,
                    variables: {
                        title: postData.title,
                        content: postData.content,
                        imageUrl: imageUrl,
                    },
                };

                if (this.state.editPost) {
                    graphqlQuery = {
                        query: `
                        mutation ($title: String!, $content: String!, $imageUrl: String!, $postId: ID!){
                            editPost(title: $title, content: $content, imageUrl: $imageUrl, postId: $postId)               
                            { 
                                _id title content creator{ name } createdAt imageUrl
                            }
                        }
                    `,
                        variables: {
                            title: postData.title,
                            content: postData.content,
                            imageUrl: imageUrl,
                            postId: this.state.editPost._id,
                        },
                    };
                }

                return fetch(url, {
                    method,
                    body: JSON.stringify(graphqlQuery),
                    headers: {
                        Authorization: 'Bearer ' + this.props.token,
                        'Content-type': 'application/json',
                    },
                });
            })
            .then(res => {
                return res.json();
            })
            .then(resData => {
                if (resData.errors) {
                    throw new Error('Creating or editing a post failed!');
                }

                let actionToUse = 'createPost';
                if (this.state.editPost) actionToUse = 'editPost';

                const post = {
                    _id: resData.data[actionToUse]._id,
                    title: resData.data[actionToUse].title,
                    content: resData.data[actionToUse].content,
                    creator: resData.data[actionToUse].creator,
                    createdAt: resData.data[actionToUse].createdAt,
                    imagePath: resData.data[actionToUse].imageUrl,
                };

                console.log('post: ', post);

                this.setState(prevState => {
                    return {
                        isEditing: false,
                        editPost: null,
                        editLoading: false,
                    };
                });
                this.loadPosts();
            })
            .catch(err => {
                console.log(err);
                this.setState({
                    isEditing: false,
                    editPost: null,
                    editLoading: false,
                    error: err,
                });
            });
    };

    statusInputChangeHandler = (input, value) => {
        this.setState({ status: value });
    };

    deletePostHandler = postId => {
        //*Delete a post
        this.setState({ postsLoading: true });

        const graphqlQuery = {
            query: `
                mutation ($postId: ID!){
                    deletePost(postId: $postId)
                }
            `,
            variables: {
                postId,
            },
        };

        fetch('http://localhost:8080/graphql', {
            headers: {
                Authorization: 'Bearer ' + this.props.token,
                'Content-type': 'application/json',
            },
            method: 'POST',
            body: JSON.stringify(graphqlQuery),
        })
            .then(res => {
                return res.json();
            })
            .then(resData => {
                if (resData.errors) {
                    throw new Error('Deleting a post failed!');
                }
                this.loadPosts();
                // this.setState(prevState => {
                //     const updatedPosts = prevState.posts.filter(
                //         p => p._id !== postId
                //     );
                //     return { posts: updatedPosts, postsLoading: false };
                // });
            })
            .catch(err => {
                console.log(err);
                this.setState({ postsLoading: false });
            });
    };

    errorHandler = () => {
        this.setState({ error: null });
    };

    catchError = error => {
        this.setState({ error: error });
    };

    render() {
        return (
            <Fragment>
                <ErrorHandler
                    error={this.state.error}
                    onHandle={this.errorHandler}
                />
                <FeedEdit
                    editing={this.state.isEditing}
                    selectedPost={this.state.editPost}
                    loading={this.state.editLoading}
                    onCancelEdit={this.cancelEditHandler}
                    onFinishEdit={this.finishEditHandler}
                />
                <section className="feed__status">
                    <form onSubmit={this.statusUpdateHandler}>
                        <Input
                            type="text"
                            placeholder="Your status"
                            control="input"
                            onChange={this.statusInputChangeHandler}
                            value={this.state.status}
                        />
                        <Button mode="flat" type="submit">
                            Update
                        </Button>
                    </form>
                </section>
                <section className="feed__control">
                    <Button
                        mode="raised"
                        design="accent"
                        onClick={this.newPostHandler}
                    >
                        New Post
                    </Button>
                </section>
                <section className="feed">
                    {this.state.postsLoading && (
                        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                            <Loader />
                        </div>
                    )}
                    {this.state.posts.length <= 0 &&
                    !this.state.postsLoading ? (
                        <p style={{ textAlign: 'center' }}>No posts found.</p>
                    ) : null}
                    {!this.state.postsLoading && (
                        <Paginator
                            onPrevious={this.loadPosts.bind(this, 'previous')}
                            onNext={this.loadPosts.bind(this, 'next')}
                            lastPage={Math.ceil(this.state.totalPosts / 2)}
                            currentPage={this.state.postPage}
                        >
                            {this.state.posts.map(post => (
                                <Post
                                    key={post._id}
                                    id={post._id}
                                    author={post.creator.name}
                                    date={new Date(
                                        post.createdAt
                                    ).toLocaleDateString('en-US')}
                                    title={post.title}
                                    image={post.imageUrl}
                                    content={post.content}
                                    onStartEdit={this.startEditPostHandler.bind(
                                        this,
                                        post._id
                                    )}
                                    onDelete={this.deletePostHandler.bind(
                                        this,
                                        post._id
                                    )}
                                />
                            ))}
                        </Paginator>
                    )}
                </section>
            </Fragment>
        );
    }
}

export default Feed;
