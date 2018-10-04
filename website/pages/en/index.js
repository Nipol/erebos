/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react')

const CompLibrary = require('../../core/CompLibrary.js')

const MarkdownBlock = CompLibrary.MarkdownBlock /* Used to read markdown */
const Container = CompLibrary.Container
const GridBlock = CompLibrary.GridBlock

const siteConfig = require(`${process.cwd()}/siteConfig.js`)

function imgUrl(img) {
  return `${siteConfig.baseUrl}img/${img}`
}

function docUrl(doc, language) {
  return `${siteConfig.baseUrl}docs/${language ? `${language}/` : ''}${doc}`
}

function pageUrl(page, language) {
  return siteConfig.baseUrl + (language ? `${language}/` : '') + page
}

class Button extends React.Component {
  render() {
    return (
      <div className="pluginWrapper buttonWrapper">
        <a className="button" href={this.props.href} target={this.props.target}>
          {this.props.children}
        </a>
      </div>
    )
  }
}

Button.defaultProps = {
  target: '_self',
}

const SplashContainer = props => (
  <div className="homeContainer">
    <div className="homeSplashFade">
      <div className="wrapper homeWrapper">{props.children}</div>
    </div>
  </div>
)

const Logo = props => (
  <div className="projectLogo">
    <img src={props.img_src} alt="Project Logo" />
  </div>
)

const ProjectTitle = () => (
  <h2 className="projectTitle">
    {siteConfig.title}
    <small>{siteConfig.tagline}</small>
  </h2>
)

const PromoSection = props => (
  <div className="section promoSection">
    <div className="promoRow">
      <div className="pluginRowBlock">{props.children}</div>
    </div>
  </div>
)

class HomeSplash extends React.Component {
  render() {
    const language = this.props.language || ''
    return (
      <SplashContainer>
        <div style={{ fontSize: 180, lineHeight: 1.2 }}>ε</div>
        <div className="inner">
          <ProjectTitle />
          <PromoSection>
            <Button href={docUrl('getting-started.html', language)}>
              Get started
            </Button>
            <Button href={docUrl('examples.html', language)}>
              See examples
            </Button>
          </PromoSection>
        </div>
      </SplashContainer>
    )
  }
}

const Block = props => (
  <Container
    padding={['bottom', 'top']}
    id={props.id}
    background={props.background}>
    <GridBlock align="center" contents={props.children} layout={props.layout} />
  </Container>
)

const Features = () => (
  <Block background="light">
    {[
      {
        title: 'Decentralized file storage',
        content:
          'Securely distribute you files accross the entire network using the [Bzz APIs](api-bzz.md)',
      },
      {
        title: 'Peer-to-peer communications',
        content:
          'Encrypted communications between nodes with no dedicated servers required using the [Pss APIs](api-pss.md)',
      },
    ]}
  </Block>
)

const FeatureCallout = () => (
  <div
    className="productShowcaseSection paddingBottom"
    style={{ textAlign: 'center', marginTop: 50 }}>
    <h2>Your entry point into decentralized apps development</h2>
    <p>
      Swarm is a distributed storage platform and content distribution network,
      a native base layer service of the Ethereum web3 stack.
    </p>
    <Button href={docUrl('introduction.html')}>
      Read the full introduction
    </Button>
  </div>
)

const LearnHow = () => (
  <Block background="light">
    {[
      {
        content: 'Talk about learning how to use this',
        title: 'Learn How',
      },
    ]}
  </Block>
)

const TryOut = () => (
  <Block id="try">
    {[
      {
        content: 'Talk about trying this out',
        title: 'Try it Out',
      },
    ]}
  </Block>
)

const Description = () => (
  <Block background="dark">
    {[
      {
        content:
          'Erebos is a JavaScript library and CLI for [Swarm](https://swarm-guide.readthedocs.io/en/latest/index.html), created by the [Mainframe team](https://github.com/MainframeHQ) originally for the [PSS-based Onyx messaging application proof of concept](https://github.com/MainframeHQ/onyx) and now used as a core piece of the [Mainframe platform](https://github.com/MainframeHQ/js-mainframe).',
        title: 'Description',
      },
    ]}
  </Block>
)

const Showcase = props => {
  if ((siteConfig.users || []).length === 0) {
    return null
  }

  const showcase = siteConfig.users.filter(user => user.pinned).map(user => (
    <a href={user.infoLink} key={user.infoLink}>
      <img src={user.image} alt={user.caption} title={user.caption} />
    </a>
  ))

  return (
    <div className="productShowcaseSection paddingBottom">
      <h2>Who is Using This?</h2>
      <p>This project is used by all these people</p>
      <div className="logos">{showcase}</div>
      <div className="more-users">
        <a className="button" href={pageUrl('users.html', props.language)}>
          More {siteConfig.title} Users
        </a>
      </div>
    </div>
  )
}

class Index extends React.Component {
  render() {
    const language = this.props.language || ''

    return (
      <div>
        <HomeSplash language={language} />
        <div className="mainContainer">
          <Features />
          <FeatureCallout />
          {/* <LearnHow /> */}
          {/* <TryOut /> */}
          {/* <Description /> */}
          {/* <Showcase language={language} /> */}
        </div>
      </div>
    )
  }
}

module.exports = Index
