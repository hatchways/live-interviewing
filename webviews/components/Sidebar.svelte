<script lang="ts">
    let name = "";
</script>
<div class="body">
      Input your name to start the interview
        <input bind:value={name} placeholder={"Your Name"}/>
        <button on:click={() => {
            tsvscode.postMessage({ type: 'inputName', value: name });
        }}>Submit</button>
</div>
<style>

input {
    margin-top: 5px;
}
button {
    margin-top: 5px;
}
.body {
    margin-top: 10px;
}
   
</style>