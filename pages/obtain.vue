<template>
  <div ref="root"></div>
</template>

<script>
  import ExampleApp from "./oauth.js"
  export default {
    mounted(){
      ExampleApp(this.$refs.root, `https://${document.location.host}/`)      
    }
  }
</script>

<style>
  table {        
        margin: 1em auto;
        border-collapse: collapse;
      }
  td {
    border: 1px solid black;
    padding: 2px;
    padding-left: 8px;
    padding-right: 8px;
  }
</style>