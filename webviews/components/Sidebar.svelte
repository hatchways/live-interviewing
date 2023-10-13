<script lang="ts">
    let name = tsvscode.getState()?.userName || "";
</script>
<div class="body">
      Input your name to start the interview
        <input bind:value={name} placeholder={"Your Name"}/>
        <button on:click={() => {
            tsvscode.postMessage({ type: 'inputName', value: name });
            tsvscode.setState({ userName: name})
        }}>Submit</button>


        <div class="subheader">
        Once your live coding session is finished, press End Interview to commit your code.
        <button on:click={() => {
            tsvscode.postMessage({ type: 'endInterview', value: ''});
            tsvscode.setState({ endInterview: true })
        }}>End Interview</button>
        </div>
</div>
<style>

input {
    margin-top: 5px;
}
button {
    margin-top: 5px;
    margin-bottom: 5px;
}
.body {
    margin-top: 10px;
}

.subheader {
    margin-top: 20px;
}
   
</style>