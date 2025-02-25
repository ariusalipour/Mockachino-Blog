---
layout: page
title: Projects
permalink: /projects/
---

<style>
  body {
    font-family: Arial, sans-serif;
    line-height: 1.6;
    margin: 0;
    padding: 0;
  }
  .container {
    max-width: 800px;
    margin: 20px auto;
    padding: 20px;
  }
  .content {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
  }
  .column {
    flex: 1;
    margin: 0 10px;
    min-width: 300px;
  }
  .column ul {
    list-style-type: none;
    padding: 0;
  }
  .column ul li {
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
    margin: 20px 0;
    padding: 10px;
    border-radius: 5px;
  }
  .project-title {
    font-weight: bold;
    font-size: 1.2em;
  }
  .project-description {
    margin: 10px;
    text-align: left;
  }
  .project-link a {
    color: #007BFF;
    text-decoration: none;
  }
  .project-link a:hover {
    text-decoration: underline;
  }
  @media (max-width: 600px) {
    .column {
      flex: 100%;
      margin: 0;
    }
  }
</style>

<div class="container">
  <div class="content">
    <div class="column">
      <h2>Engineering Projects</h2>
      <ul>
        <li>
          <div class="project-title">WINMSS Buddy</div>
          <div class="project-description">Description of programming project 2.</div>
          <div class="project-link"><a href="http://example.com/project2">View Project</a></div>
        </li>
        <li>
          <div class="project-title">Project 3</div>
          <div class="project-description">Description of programming project 3.</div>
          <div class="project-link"><a href="http://example.com/project3">View Project</a></div>
        </li>
        <li>
          <div class="project-title">Practical Shooter App (Legacy)</div>
          <div class="project-description">A mobile app providing the IPSC ruleset offline in a mobile friendly and dynamic way. This is unfortunately not being maintained anymore but is due a resurgence.</div>
          <div class="project-link"><a href="https://apkpure.com/the-practical-shooter-app/com.barneymcgrew.practicalshooterapp/download/2.7">View Project</a></div>
        </li>
      </ul>
    </div>
    <div class="column">
      <h2>Media Projects</h2>
      <ul>
        <li>
          <div class="project-title">Project A</div>
          <div class="project-description">Description of media project A.</div>
          <div class="project-link"><a href="http://example.com/projectA">View Project</a></div>
        </li>
        <li>
          <div class="project-title">Project B</div>
          <div class="project-description">Description of media project B.</div>
          <div class="project-link"><a href="http://example.com/projectB">View Project</a></div>
        </li>
        <li>
          <div class="project-title">Project C</div>
          <div class="project-description">Description of media project C.</div>
          <div class="project-link"><a href="http://example.com/projectC">View Project</a></div>
        </li>
      </ul>
    </div>
  </div>
</div>
